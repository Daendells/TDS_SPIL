package services

import (
	"github.com/robfig/cron/v3"
	"github.com/sirupsen/logrus"
)

type CronService struct {
	cron                  *cron.Cron
	log                   *logrus.Logger
	IDPCalculationService *IDPCalculationService
	ApolloAPIService      *ApolloAPIService
	NanikaAPIService      *NanikaAPIService
}

func NewCronService(
	log *logrus.Logger,
	idpCalculationService *IDPCalculationService,
	apolloAPIService *ApolloAPIService,
	nanikaAPIService *NanikaAPIService,
) *CronService {
	// Create cron with seconds support
	c := cron.New(cron.WithSeconds())

	return &CronService{
		cron:                  c,
		log:                   log,
		IDPCalculationService: idpCalculationService,
		ApolloAPIService:      apolloAPIService,
		NanikaAPIService:      nanikaAPIService,
	}
}

func (s *CronService) Start() error {
	s.log.Info("Starting cron service...")

	// Daily readiness calculation at 2 AM
	_, err := s.cron.AddFunc("0 0 2 * * *", func() {
		s.log.Info("Running daily readiness calculation...")
		if err := s.IDPCalculationService.CalculateReadinessForAllReports(); err != nil {
			s.log.Errorf("Failed to calculate readiness for all reports: %v", err)
		} else {
			s.log.Info("Daily readiness calculation completed successfully")
		}
	})
	if err != nil {
		return err
	}

	// TESTING: Fetch Nanika API every 10 minutes (change to "0 0 2 * * *" for production)
	_, err = s.cron.AddFunc("0 */10 * * * *", func() {
		s.log.Info("⏰ [CRON TRIGGERED] Fetching Nanika API every 10 minutes (TESTING MODE)...")
		if err := s.NanikaAPIService.FetchAndCacheSeamenData(); err != nil {
			s.log.Errorf("❌ Failed to fetch seamen data: %v", err)
		}
		if err := s.NanikaAPIService.FetchAndCacheMutationData(); err != nil {
			s.log.Errorf("❌ Failed to fetch mutation data: %v", err)
		}
		s.log.Info("✅ [CRON FINISHED] Nanika API sync completed")
	})
	if err != nil {
		return err
	}

	// Clean expired cache every day at 3 AM
	_, err = s.cron.AddFunc("0 0 3 * * *", func() {
		s.log.Info("Cleaning expired Apollo API cache...")
		if err := s.ApolloAPIService.CleanExpiredCache(); err != nil {
			s.log.Errorf("Failed to clean expired cache: %v", err)
		} else {
			s.log.Info("Expired cache cleaned successfully")
		}
	})
	if err != nil {
		return err
	}

	s.cron.Start()
	s.log.Info("Cron service started successfully")

	return nil
}

// Stop gracefully stops all cron jobs
func (s *CronService) Stop() {
	s.log.Info("Stopping cron service...")
	s.cron.Stop()
	s.log.Info("Cron service stopped")
}
