package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/cache"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/postgres"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/postgresrepo"
	redisplatform "github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/redis"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	pool, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer pool.Close()

	redisClient := redisplatform.NewClient(cfg.RedisAddr, cfg.RedisPassword)
	defer redisClient.Close()

	repos := postgresrepo.New(pool).Repositories()
	repos = cache.WrapRepositories(repos, cache.NewRedisStore(redisClient), 5*time.Minute)
	server := httpserver.NewWithRepositories(cfg, repos)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
