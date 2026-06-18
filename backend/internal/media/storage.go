package media

import (
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const MaxImageBytes int64 = 5 << 20

var ErrInvalidMediaPath = errors.New("invalid media path")
var ErrInvalidContentType = errors.New("invalid content type")
var ErrFileTooLarge = errors.New("file too large")

func PublicURL(base string, mediaPath *string) *string {
	if mediaPath == nil || *mediaPath == "" {
		return nil
	}
	if strings.HasPrefix(*mediaPath, "http://") || strings.HasPrefix(*mediaPath, "https://") {
		return mediaPath
	}
	value := strings.TrimRight(base, "/") + "/media/" + strings.TrimLeft(*mediaPath, "/")
	return &value
}

func ValidateMediaPath(mediaPath string) error {
	if mediaPath == "" || strings.HasPrefix(mediaPath, "/") {
		return ErrInvalidMediaPath
	}
	cleaned := filepath.ToSlash(filepath.Clean(mediaPath))
	if cleaned != mediaPath || strings.HasPrefix(cleaned, "../") || cleaned == ".." {
		return ErrInvalidMediaPath
	}
	if strings.HasPrefix(cleaned, "maps/") || strings.HasPrefix(cleaned, "lineups/") {
		return nil
	}
	return ErrInvalidMediaPath
}

func SaveMultipartFile(root string, folder string, file io.Reader, header *multipart.FileHeader) (string, error) {
	return saveMultipartFile(root, folder, file, header.Filename, header.Header.Get("Content-Type"), header.Size)
}

func saveMultipartFile(root string, folder string, file io.Reader, filename string, contentType string, size int64) (string, error) {
	if folder != "maps" && folder != "lineups" {
		return "", ErrInvalidMediaPath
	}
	if size > MaxImageBytes {
		return "", ErrFileTooLarge
	}
	if !allowedImage(contentType, filename) {
		return "", ErrInvalidContentType
	}
	filename = filepath.Base(filename)
	stored := filepath.ToSlash(filepath.Join(folder, filename))
	if err := ValidateMediaPath(stored); err != nil {
		return "", err
	}
	dst := filepath.Join(root, stored)
	if err := os.MkdirAll(filepath.Dir(dst), 0o755); err != nil {
		return "", err
	}
	out, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer out.Close()
	limited := io.LimitReader(file, MaxImageBytes+1)
	written, err := io.Copy(out, limited)
	if err != nil {
		return "", err
	}
	if written > MaxImageBytes {
		return "", ErrFileTooLarge
	}
	return stored, nil
}

func DetectContentType(prefix []byte) string {
	return http.DetectContentType(prefix)
}

func allowedImage(contentType string, filename string) bool {
	switch strings.ToLower(contentType) {
	case "image/png", "image/jpeg":
		return true
	case "", "application/octet-stream":
		ext := strings.ToLower(filepath.Ext(filename))
		return ext == ".png" || ext == ".jpg" || ext == ".jpeg"
	default:
		return false
	}
}
