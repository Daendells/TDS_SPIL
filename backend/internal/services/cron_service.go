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
}

func NewCronService(
	log *logrus.Logger,
	idpCalculationService *IDPCalculationService,
	apolloAPIService *ApolloAPIService,
) *CronService {
	// Create cron with seconds support
	c := cron.New(cron.WithSeconds())

	return &CronService{
		cron:                  c,
		log:                   log,
		IDPCalculationService: idpCalculationService,
		ApolloAPIService:      apolloAPIService,
	}
}

// Start initializes and starts all cron jobs
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
