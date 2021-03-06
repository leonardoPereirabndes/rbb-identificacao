FROM node:8
MAINTAINER SuporteInfraAplicacoes <suporte-infra-aplicacoes@bndes.gov.br>

# Corrigir timezone
RUN ln -snf /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime

ADD ./Back /backend/Back

ADD ./Back-Blockchain/ /backend/Back-Blockchain

WORKDIR /backend/Back

RUN npm install

EXPOSE 8080

VOLUME ["/backend/Back/config.json"]
VOLUME ["/backend/Back/arquivos/declaracao"]
VOLUME ["/backend/Back/arquivos/modelo_declaracao"]

ENTRYPOINT ["npm","start"]