package telegram

import (
	"context"
	"errors"
	"testing"
	"time"
)

type recordingGetter struct {
	offsets []int
	errs    []error
}

func (g *recordingGetter) GetUpdates(ctx context.Context, offset int, timeout int) ([]Update, error) {
	g.offsets = append(g.offsets, offset)
	if len(g.errs) > 0 {
		err := g.errs[0]
		g.errs = g.errs[1:]
		if err != nil {
			return nil, err
		}
	}
	return []Update{{UpdateID: 4, Message: &Message{Chat: Chat{ID: 1}, Text: "/start"}}}, nil
}

type cancelingUpdateHandler struct {
	cancel  context.CancelFunc
	updates []Update
	err     error
}

func (h *cancelingUpdateHandler) HandleUpdate(ctx context.Context, update Update) error {
	h.updates = append(h.updates, update)
	h.cancel()
	return h.err
}

func TestPollProcessesUpdatesAndAdvancesOffset(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	getter := &recordingGetter{}
	handler := &cancelingUpdateHandler{cancel: cancel}

	err := Poll(ctx, getter, handler, 30)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Poll error = %v, want context.Canceled", err)
	}
	if len(getter.offsets) != 1 || getter.offsets[0] != 0 {
		t.Fatalf("offsets = %#v", getter.offsets)
	}
	if len(handler.updates) != 1 || handler.updates[0].UpdateID != 4 {
		t.Fatalf("handled updates = %#v", handler.updates)
	}
}

func TestPollReturnsGetterError(t *testing.T) {
	wantErr := errors.New("get failed")
	withRetryBackoff(t, time.Nanosecond)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := Poll(ctx, &recordingGetter{errs: []error{wantErr}}, &cancelingUpdateHandler{cancel: cancel}, 30)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Poll error = %v, want %v", err, context.Canceled)
	}
}

func TestPollRetriesAfterGetterError(t *testing.T) {
	withRetryBackoff(t, 0)
	ctx, cancel := context.WithCancel(context.Background())
	getter := &recordingGetter{errs: []error{errors.New("temporary network failure")}}
	handler := &cancelingUpdateHandler{cancel: cancel}

	err := Poll(ctx, getter, handler, 30)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Poll error = %v, want %v", err, context.Canceled)
	}
	if len(getter.offsets) != 2 {
		t.Fatalf("getter called %d times, want retry", len(getter.offsets))
	}
	if len(handler.updates) != 1 {
		t.Fatalf("handled %d updates", len(handler.updates))
	}
}

func TestPollReturnsContextErrorWhenRetryBackoffDisabledAndContextCanceled(t *testing.T) {
	withRetryBackoff(t, 0)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := Poll(ctx, &recordingGetter{errs: []error{errors.New("temporary network failure")}}, &cancelingUpdateHandler{cancel: cancel}, 30)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Poll error = %v, want %v", err, context.Canceled)
	}
}

func TestWaitRetryReturnsCanceledContext(t *testing.T) {
	withRetryBackoff(t, time.Hour)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := waitRetry(ctx)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("waitRetry error = %v, want %v", err, context.Canceled)
	}
}

func TestWaitRetryReturnsNilAfterTimer(t *testing.T) {
	withRetryBackoff(t, time.Nanosecond)

	if err := waitRetry(context.Background()); err != nil {
		t.Fatalf("waitRetry returned error: %v", err)
	}
}

func withRetryBackoff(t *testing.T, backoff time.Duration) {
	t.Helper()
	original := retryBackoff
	retryBackoff = backoff
	t.Cleanup(func() { retryBackoff = original })
}

func TestPollContinuesAfterHandlerError(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	getter := &recordingGetter{}
	handler := &cancelingUpdateHandler{cancel: cancel, err: errors.New("handler failed")}

	err := Poll(ctx, getter, handler, 30)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("Poll error = %v, want context.Canceled", err)
	}
	if len(handler.updates) != 1 {
		t.Fatalf("handled %d updates", len(handler.updates))
	}
}
