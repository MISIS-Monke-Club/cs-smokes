package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	var sentinelFile string
	var logsDir string
	flag.StringVar(&sentinelFile, "sentinel-file", "", "file containing raw sentinel values")
	flag.StringVar(&logsDir, "logs", "", "directory containing captured logs")
	flag.Parse()
	if err := run(sentinelFile, logsDir); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(sentinelFile string, logsDir string) error {
	if sentinelFile == "" || logsDir == "" {
		return fmt.Errorf("--sentinel-file and --logs are required")
	}
	sentinels, err := readSentinels(sentinelFile)
	if err != nil {
		return err
	}
	return filepath.WalkDir(logsDir, func(path string, entry os.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		if samePath(path, sentinelFile) {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		for _, sentinel := range sentinels {
			if strings.Contains(string(content), sentinel) {
				return fmt.Errorf("sentinel leaked in %s", path)
			}
		}
		return nil
	})
}

func readSentinels(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	var sentinels []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			sentinels = append(sentinels, line)
		}
	}
	return sentinels, scanner.Err()
}

func samePath(left string, right string) bool {
	leftAbs, _ := filepath.Abs(left)
	rightAbs, _ := filepath.Abs(right)
	return leftAbs == rightAbs
}
