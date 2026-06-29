package telegram

import (
	"context"
	"log"
	"time"
)

var retryBackoff = time.Second

type UpdateGetter interface {
	GetUpdates(ctx context.Context, offset int, timeout int) ([]Update, error)
}

type UpdateHandler interface {
	HandleUpdate(ctx context.Context, update Update) error
}

func Poll(ctx context.Context, getter UpdateGetter, handler UpdateHandler, timeout int) error {
	offset := 0
	for {
		updates, err := getter.GetUpdates(ctx, offset, timeout)
		if err != nil {
			log.Printf("get updates: %v", err)
			if err := waitRetry(ctx); err != nil {
				return err
			}
			continue
		}
		for _, update := range updates {
			if update.UpdateID >= offset {
				offset = update.UpdateID + 1
			}
			if err := handler.HandleUpdate(ctx, update); err != nil {
				log.Printf("handle update %d: %v", update.UpdateID, err)
			}
		}
		if err := ctx.Err(); err != nil {
			return err
		}
	}
}

func waitRetry(ctx context.Context) error {
	if retryBackoff <= 0 {
		return ctx.Err()
	}

	timer := time.NewTimer(retryBackoff)
	defer timer.Stop()

	select {
	case <-timer.C:
		return ctx.Err()
	case <-ctx.Done():
		return ctx.Err()
	}
}
