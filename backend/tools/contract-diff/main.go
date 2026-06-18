package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/tests/contract"
)

type config struct {
	oldBase    string
	newBase    string
	corpusPath string
	client     *http.Client
	output     io.Writer
}

func main() {
	cfg := config{output: os.Stdout}
	flag.StringVar(&cfg.oldBase, "old-base", "", "legacy backend base URL")
	flag.StringVar(&cfg.newBase, "new-base", "", "new backend base URL")
	flag.StringVar(&cfg.corpusPath, "corpus", "./tests/contract/corpus.yaml", "contract corpus YAML")
	flag.Parse()

	if err := run(context.Background(), cfg); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(ctx context.Context, cfg config) error {
	if cfg.oldBase == "" || cfg.newBase == "" {
		return errors.New("--old-base and --new-base are required")
	}
	if cfg.client == nil {
		cfg.client = &http.Client{Timeout: 10 * time.Second}
	}
	if cfg.output == nil {
		cfg.output = io.Discard
	}

	corpus, err := contract.LoadCorpus(cfg.corpusPath)
	if err != nil {
		return fmt.Errorf("load corpus: %w", err)
	}
	if err := checkLegacyBaseline(ctx, cfg.client, cfg.oldBase); err != nil {
		return fmt.Errorf("legacy baseline unavailable: %w", err)
	}

	var diffs []contract.DiffReport
	for _, testCase := range corpus.Cases {
		oldResp, err := issue(ctx, cfg.client, cfg.oldBase, testCase)
		if err != nil {
			return fmt.Errorf("%s legacy request failed: %w", testCase.Name, err)
		}
		newResp, err := issue(ctx, cfg.client, cfg.newBase, testCase)
		if err != nil {
			return fmt.Errorf("%s new backend request failed: %w", testCase.Name, err)
		}
		diff := contract.CompareResponses(testCase.Name, oldResp, newResp)
		if diff.HasDifferences() {
			diffs = append(diffs, diff)
		}
	}
	if len(diffs) > 0 {
		lines := make([]string, 0, len(diffs)+1)
		lines = append(lines, fmt.Sprintf("contract diff failed with %d differing case(s)", len(diffs)))
		for _, diff := range diffs {
			lines = append(lines, diff.String())
		}
		return errors.New(strings.Join(lines, "\n"))
	}

	fmt.Fprintf(cfg.output, "contract diff passed for %d case(s)\n", len(corpus.Cases))
	return nil
}

func checkLegacyBaseline(ctx context.Context, client *http.Client, base string) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, joinURL(base, "/api/health"), nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 500 {
		return fmt.Errorf("health status %d", resp.StatusCode)
	}
	return nil
}

func issue(ctx context.Context, client *http.Client, base string, testCase contract.Case) (contract.ResponseSnapshot, error) {
	req, err := http.NewRequestWithContext(ctx, testCase.Method, joinURL(base, testCase.Path), strings.NewReader(testCase.Body))
	if err != nil {
		return contract.ResponseSnapshot{}, err
	}
	for key, value := range testCase.Headers {
		req.Header.Set(key, value)
	}
	resp, err := client.Do(req)
	if err != nil {
		return contract.ResponseSnapshot{}, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return contract.ResponseSnapshot{}, err
	}
	return contract.ResponseSnapshot{
		StatusCode:  resp.StatusCode,
		ContentType: resp.Header.Get("Content-Type"),
		Body:        body,
	}, nil
}

func joinURL(base string, path string) string {
	parsed, err := url.Parse(base)
	if err != nil {
		return strings.TrimRight(base, "/") + path
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/") + path
	parsed.RawQuery = ""
	return parsed.String()
}
