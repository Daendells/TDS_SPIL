package config

import (
	"os"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	easy "github.com/t-tomalak/logrus-easy-formatter"
)

func NewLogger(viper *viper.Viper) *logrus.Logger {
	// log := logrus.New()
	log := &logrus.Logger{
		Out: os.Stderr,
		Formatter: &easy.Formatter{
			TimestampFormat: "2006-01-02 15:04:05",
			LogFormat:       "%lvl%[%time%] %msg%\n\n",
		},
	}

	log.SetLevel(logrus.Level(viper.GetInt32("LOG_LEVEL")))
	return log
}
