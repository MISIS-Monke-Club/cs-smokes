package webapp

import "testing"

func TestWithInitDataAppendsInitData(t *testing.T) {
	got, err := WithInitData("https://example.com/app", "query_id=1&user=demo")
	if err != nil {
		t.Fatalf("WithInitData returned error: %v", err)
	}

	want := "https://example.com/app?initData=query_id%3D1%26user%3Ddemo"
	if got != want {
		t.Fatalf("URL = %q, want %q", got, want)
	}
}

func TestWithInitDataPreservesExistingQuery(t *testing.T) {
	got, err := WithInitData("https://example.com/app?theme=dark", "")
	if err != nil {
		t.Fatalf("WithInitData returned error: %v", err)
	}

	want := "https://example.com/app?initData=&theme=dark"
	if got != want {
		t.Fatalf("URL = %q, want %q", got, want)
	}
}

func TestWithInitDataRejectsInvalidBaseURL(t *testing.T) {
	if _, err := WithInitData("://bad-url", ""); err == nil {
		t.Fatalf("expected invalid base URL to fail")
	}
}
