# ─── Makefile — Rastreamento WPP ─────────────────────────────────────────────
# Todos os comandos rodam no seu Mac.
# Comandos que precisam do servidor usam SSH automaticamente.
#
# Uso:
#   make <comando>
#
# Primeiro uso: copie o arquivo .env.make e preencha:
#   cp .env.make.example .env.make

# ─── Configuração ─────────────────────────────────────────────────────────────
-include .env.make

SERVER_HOST   ?= 103.199.184.64
SERVER_USER   ?= root
SERVER_SSH    := ssh $(SERVER_USER)@$(SERVER_HOST)
SERVER_SCP    := scp
APP_DIR       := /opt/rastreamentowpp
IMAGE         ?= ghcr.io/$(shell git config --get remote.origin.url | sed 's/.*github.com[:/]//' | sed 's/\.git//' | tr '[:upper:]' '[:lower:]'):latest

.DEFAULT_GOAL := help

# ─── Ajuda ────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  Rastreamento WPP — Comandos disponíveis"
	@echo ""
	@echo "  SETUP INICIAL (executar uma vez)"
	@echo "    make setup-server     Configura o servidor (Docker, Swarm, redes, Portainer)"
	@echo "    make deploy-infra     Envia e sobe Traefik + Portainer no servidor"
	@echo ""
	@echo "  DEPLOY"
	@echo "    make deploy           Faz push para main e aciona o GitHub Actions"
	@echo "    make deploy-force     Força redeploy sem alterar código"
	@echo ""
	@echo "  MONITORAMENTO"
	@echo "    make logs             Acompanha logs do app em tempo real"
	@echo "    make status           Mostra status dos serviços"
	@echo "    make ps               Lista containers em execução"
	@echo ""
	@echo "  BANCO DE DADOS"
	@echo "    make db-backup        Faz backup do PostgreSQL → ./backups/"
	@echo "    make db-shell         Abre psql no servidor"
	@echo ""
	@echo "  DOCKER LOCAL (para testar antes de fazer push)"
	@echo "    make build-local      Builda a imagem Docker localmente"
	@echo "    make run-local        Sobe a stack localmente com docker compose"
	@echo "    make stop-local       Para a stack local"
	@echo ""
	@echo "  OUTROS"
	@echo "    make ssh              Abre terminal SSH no servidor"
	@echo "    make rollback         Faz rollback para a versão anterior"
	@echo ""

# ─── Setup Inicial ────────────────────────────────────────────────────────────

## Configura o servidor remotamente (roda script no servidor via SSH)
.PHONY: setup-server
setup-server:
	@echo "→ Enviando script de setup para o servidor..."
	$(SERVER_SCP) scripts/server-setup.sh $(SERVER_USER)@$(SERVER_HOST):~/server-setup.sh
	@echo "→ Executando setup no servidor..."
	$(SERVER_SSH) "bash ~/server-setup.sh $(SERVER_HOST)"

## Envia o docker-compose.infra.yml e sobe Traefik + Portainer
.PHONY: deploy-infra
deploy-infra:
	@echo "→ Enviando docker-compose.infra.yml para o servidor..."
	$(SERVER_SCP) docker-compose.infra.yml $(SERVER_USER)@$(SERVER_HOST):$(APP_DIR)/
	@echo "→ Subindo stack de infraestrutura..."
	$(SERVER_SSH) "docker stack deploy -c $(APP_DIR)/docker-compose.infra.yml infra"
	@echo "✓ Infraestrutura no ar!"
	@echo "  Portainer: https://$(SERVER_HOST):9443"
	@echo "  Traefik:   http://$(SERVER_HOST):8080"

# ─── Deploy ───────────────────────────────────────────────────────────────────

## Faz git push para main → GitHub Actions cuida do deploy
.PHONY: deploy
deploy:
	git push origin main
	@echo "✓ Push feito. Acompanhe o deploy em:"
	@echo "  https://github.com/$(shell git config --get remote.origin.url | sed 's/.*github.com[:/]//' | sed 's/\.git//')/actions"

## Força redeploy do app sem alterar código
.PHONY: deploy-force
deploy-force:
	$(SERVER_SSH) "docker service update --force rastreamentowpp_app"

## Rollback para a versão anterior
.PHONY: rollback
rollback:
	$(SERVER_SSH) "docker service update --rollback rastreamentowpp_app"
	@echo "✓ Rollback iniciado."

# ─── Monitoramento ────────────────────────────────────────────────────────────

## Acompanha logs do app em tempo real
.PHONY: logs
logs:
	$(SERVER_SSH) "docker service logs rastreamentowpp_app --follow --tail 100"

## Mostra status dos serviços
.PHONY: status
status:
	$(SERVER_SSH) "docker service ls --filter name=rastreamentowpp && echo '' && docker service ps rastreamentowpp_app"

## Lista containers em execução
.PHONY: ps
ps:
	$(SERVER_SSH) "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# ─── Banco de Dados ───────────────────────────────────────────────────────────

## Faz backup do PostgreSQL e baixa para ./backups/
.PHONY: db-backup
db-backup:
	@mkdir -p backups
	$(SERVER_SSH) "docker exec \$$(docker ps -q -f name=rastreamentowpp_db) pg_dump -U rastreamento rastreamentowpp" \
		> backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✓ Backup salvo em backups/"

## Abre terminal psql no servidor
.PHONY: db-shell
db-shell:
	$(SERVER_SSH) -t "docker exec -it \$$(docker ps -q -f name=rastreamentowpp_db) psql -U rastreamento -d rastreamentowpp"

# ─── Docker Local ─────────────────────────────────────────────────────────────

## Builda a imagem Docker localmente (para testar antes de push)
.PHONY: build-local
build-local:
	docker build -t rastreamentowpp:local .
	@echo "✓ Imagem rastreamentowpp:local criada."

## Sobe a stack localmente (requer .env na raiz do projeto)
.PHONY: run-local
run-local:
	@test -f .env || (echo "❌ Arquivo .env não encontrado." && exit 1)
	docker compose -f docker-compose.local.yml up -d
	@echo "✓ App rodando em http://localhost:3001"

## Para a stack local
.PHONY: stop-local
stop-local:
	docker compose -f docker-compose.local.yml down

# ─── SSH ──────────────────────────────────────────────────────────────────────

## Abre terminal SSH no servidor
.PHONY: ssh
ssh:
	$(SERVER_SSH)
