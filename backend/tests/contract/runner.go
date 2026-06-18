package contract

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"mime"
	"os"
	"reflect"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

type Corpus struct {
	Metadata Metadata `yaml:"metadata"`
	Cases    []Case   `yaml:"cases"`
}

type Metadata struct {
	ContractCorpusVersion string `yaml:"contract_corpus_version"`
	LegacyGitCommit       any    `yaml:"legacy_git_commit"`
	LegacyImage           string `yaml:"legacy_image"`
	LegacyManifest        string `yaml:"legacy_manifest"`
}

type Case struct {
	Name    string            `yaml:"name"`
	Method  string            `yaml:"method"`
	Path    string            `yaml:"path"`
	Headers map[string]string `yaml:"headers"`
	Body    string            `yaml:"body"`
	Tags    []string          `yaml:"tags"`
}

type ResponseSnapshot struct {
	StatusCode  int
	ContentType string
	Body        []byte
}

type DiffReport struct {
	CaseName    string
	Differences []string
}

func LoadCorpus(path string) (Corpus, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return Corpus{}, err
	}
	var corpus Corpus
	if err := yaml.Unmarshal(content, &corpus); err != nil {
		return Corpus{}, err
	}
	if corpus.Metadata.ContractCorpusVersion == "" {
		return Corpus{}, errors.New("metadata.contract_corpus_version is required")
	}
	for i := range corpus.Cases {
		corpus.Cases[i].Method = strings.ToUpper(strings.TrimSpace(corpus.Cases[i].Method))
		if corpus.Cases[i].Name == "" {
			return Corpus{}, fmt.Errorf("case %d name is required", i)
		}
		if corpus.Cases[i].Method == "" {
			return Corpus{}, fmt.Errorf("case %q method is required", corpus.Cases[i].Name)
		}
		if !strings.HasPrefix(corpus.Cases[i].Path, "/") {
			return Corpus{}, fmt.Errorf("case %q path must start with /", corpus.Cases[i].Name)
		}
	}
	return corpus, nil
}

func (c Corpus) HasPath(path string) bool {
	for _, testCase := range c.Cases {
		if testCase.Path == path {
			return true
		}
	}
	return false
}

func (c Corpus) HasCase(method string, path string) bool {
	method = strings.ToUpper(method)
	for _, testCase := range c.Cases {
		if testCase.Method == method && testCase.Path == path {
			return true
		}
	}
	return false
}

func (c Corpus) Tags() []string {
	seen := map[string]bool{}
	for _, testCase := range c.Cases {
		for _, tag := range testCase.Tags {
			seen[tag] = true
		}
	}
	tags := make([]string, 0, len(seen))
	for tag := range seen {
		tags = append(tags, tag)
	}
	sort.Strings(tags)
	return tags
}

func CompareResponses(caseName string, oldResp ResponseSnapshot, newResp ResponseSnapshot) DiffReport {
	report := DiffReport{CaseName: caseName}
	if oldResp.StatusCode != newResp.StatusCode {
		report.Differences = append(report.Differences, fmt.Sprintf("status code: old=%d new=%d", oldResp.StatusCode, newResp.StatusCode))
	}
	oldContentType := normalizeContentType(oldResp.ContentType)
	newContentType := normalizeContentType(newResp.ContentType)
	if oldContentType != newContentType {
		report.Differences = append(report.Differences, fmt.Sprintf("content type: old=%q new=%q", oldContentType, newContentType))
	}

	if isJSON(oldContentType) && isJSON(newContentType) {
		oldJSON, oldErr := decodeJSON(oldResp.Body)
		newJSON, newErr := decodeJSON(newResp.Body)
		if oldErr != nil || newErr != nil {
			if !bytes.Equal(bytes.TrimSpace(oldResp.Body), bytes.TrimSpace(newResp.Body)) {
				report.Differences = append(report.Differences, "json body: invalid JSON differs")
			}
			return report
		}
		oldJSON = normalizeVolatile(oldJSON)
		newJSON = normalizeVolatile(newJSON)
		if !reflect.DeepEqual(oldJSON, newJSON) {
			report.Differences = append(report.Differences, "json body: normalized bodies differ")
		}
		return report
	}

	if !bytes.Equal(bytes.TrimSpace(oldResp.Body), bytes.TrimSpace(newResp.Body)) {
		report.Differences = append(report.Differences, "body: raw bodies differ")
	}
	return report
}

func (d DiffReport) HasDifferences() bool {
	return len(d.Differences) > 0
}

func (d DiffReport) String() string {
	if !d.HasDifferences() {
		return d.CaseName + ": no differences"
	}
	return d.CaseName + ": " + strings.Join(d.Differences, "; ")
}

func normalizeContentType(contentType string) string {
	if contentType == "" {
		return ""
	}
	mediaType, _, err := mime.ParseMediaType(contentType)
	if err != nil {
		return strings.ToLower(strings.TrimSpace(contentType))
	}
	return strings.ToLower(mediaType)
}

func isJSON(contentType string) bool {
	return contentType == "application/json" || strings.HasSuffix(contentType, "+json")
}

func decodeJSON(body []byte) (any, error) {
	var decoded any
	decoder := json.NewDecoder(bytes.NewReader(body))
	decoder.UseNumber()
	if err := decoder.Decode(&decoded); err != nil {
		return nil, err
	}
	return decoded, nil
}

func normalizeVolatile(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		normalized := make(map[string]any, len(typed))
		for key, child := range typed {
			if volatileKeys[strings.ToLower(key)] {
				normalized[key] = "<volatile>"
				continue
			}
			normalized[key] = normalizeVolatile(child)
		}
		return normalized
	case []any:
		normalized := make([]any, len(typed))
		for i, child := range typed {
			normalized[i] = normalizeVolatile(child)
		}
		return normalized
	default:
		return value
	}
}

var volatileKeys = map[string]bool{
	"access_token":     true,
	"refresh_token":    true,
	"token":            true,
	"created_at":       true,
	"updated_at":       true,
	"closed_at":        true,
	"date_of_creation": true,
	"expires_at":       true,
	"exp":              true,
	"iat":              true,
}
