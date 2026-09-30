.PHONY: help install dev dev-web dev-worker build build-web deploy-worker db-push db-generate db-migrate db-studio lint clean

# Varsayılan hedef: help
.DEFAULT_GOAL := help

# Renkler
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Mevcut tüm komutları ve açıklamalarını listeler
	@echo ""
	@echo "$(CYAN)OpsPulse Monorepo Komut Listesi:$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-18s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# Kurulum ve Bağımlılıklar
install: ## Monorepo genelindeki tüm bağımlılıkları yükler
	npm install

# Geliştirme (Development)
dev: ## Hem frontend (web) hem backend (worker) servislerini paralel başlatır
	@echo "$(CYAN)Geliştirme ortamı başlatılıyor...$(RESET)"
	npm run dev:web & npm run dev:worker

dev-web: ## Yalnızca Vite + React frontend uygulamasını başlatır
	npm run dev --workspace=apps/web

dev-worker: ## Yalnızca Cloudflare Worker API'yi (wrangler) başlatır
	npm run dev --workspace=apps/worker

# Derleme ve Canlıya Alma (Build & Deploy)
build: build-web ## Tüm uygulamaları derler

build-web: ## Cloudflare Pages için web uygulamasını derler (dist/)
	npm run build --workspace=apps/web

deploy-worker: ## Cloudflare Worker backend servisini canlıya alır
	npm run deploy --workspace=apps/worker

# Veritabanı ve Drizzle ORM İşlemleri
db-push: ## Drizzle şemasını doğrudan Neon PostgreSQL veritabanına uygular (Push)
	npm run db:push --workspace=apps/worker

db-generate: ## Drizzle şemasından yeni SQL migration dosyaları üretir
	npm run db:generate --workspace=apps/worker

db-migrate: ## Üretilen SQL migration dosyalarını Neon veritabanına uygular
	npm run db:migrate --workspace=apps/worker

db-studio: ## Drizzle Studio web arayüzünü açarak kayıtları inceler
	npm run db:studio --workspace=apps/worker

# Kod Kalitesi ve Temizlik
lint: ## Kod tabanında tip ve sözdizimi kontrollerini çalıştırır
	npm run lint --workspace=apps/web || true

clean: ## node_modules, dist ve derleme artıklarını temizler
	rm -rf node_modules apps/web/node_modules apps/worker/node_modules apps/web/dist