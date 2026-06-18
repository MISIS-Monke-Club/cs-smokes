package cache_test

import (
	"context"
	"time"
)

type memoryStore struct {
	data            map[string][]byte
	deletedPrefixes []string
	getErr          error
	setErr          error
}

func newMemoryStore() *memoryStore {
	return &memoryStore{data: map[string][]byte{}}
}

func (s *memoryStore) Get(_ context.Context, key string) ([]byte, error) {
	if s.getErr != nil {
		return nil, s.getErr
	}
	value, ok := s.data[key]
	if !ok {
		return nil, nil
	}
	return value, nil
}

func (s *memoryStore) Set(_ context.Context, key string, value []byte, _ time.Duration) error {
	if s.setErr != nil {
		return s.setErr
	}
	s.data[key] = value
	return nil
}

func (s *memoryStore) DeletePrefix(_ context.Context, prefix string) error {
	s.deletedPrefixes = append(s.deletedPrefixes, prefix)
	for key := range s.data {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(s.data, key)
		}
	}
	return nil
}
