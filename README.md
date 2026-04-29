# 🌍 Coimbra Monitoramento de Acessibilidade

Plataforma Web App colaborativa projetada para mapear, reportar e visualizar barreiras arquitetônicas, problemas de infraestrutura e obstáculos à acessibilidade urbana em tempo real.

O sistema opera com um fluxo PWA (Progressive Web App) para o público geral reportar problemas e um Dashboard Administrativo restrito para gestão inteligente.

---

## 🚀 Principais Funcionalidades

### 📱 1. App Cliente (Coleta de Dados)
- **Localização de Alta Precisão:** Captura de coordenadas baseada no Sensor GPS nativo via `navigator.geolocation`.
- **Fallback Inteligente:** Se o dispositivo demorar a obter sinal de satélite ou não autorizar, o sistema realiza um *Fallback* de localização via API Baseada em IP (`ipapi.co`).
- **Geocoding Reverso Dinâmico:** Envio automático das coordenadas do usuário para a API `Nominatim (OpenStreetMap)`, detectando e salvando de forma inteligente: País, Cidade, Estado e Logradouro, sem nenhuma inserção manual.
- **Intervenção Manual no Mapa:** O usuário também possui a capacidade de alterar a localização caso perceba erro do satélite, com interface simples "Point-and-Click" via Leaflet.
- **Câmera Integrada:** Possibilidade de capturar a foto do obstáculo, compressão automática no cliente e envio assíncrono.

### 📊 2. Dashboard Administrativo (`/admin`)
- **Gestão Serverless:** Todo o backend gerenciado pelo Firebase (Realtime Database e Storage).
- **Mapa de Calor Analytics (Heatmap):** Aglomeração visual das concentrações de ocorrências na interface do gestor.
- **Filtros Auto-Gerados Dinâmicos:** Em vez de dropdowns fixos engessados, o sistema auto-constrói os filtros através de queries sobre os próprios dados capturados. Se um cidadão reportar um problema em *"Portugal"*, imediatamente *"Portugal"* aparecerá no combo-box, além de filtrar assincronamente as cidades pertencentes àquele país específico.
- **Gráficos Táticos:** Painel com `Recharts` listando tipos de ocorrências mais relatadas (Ex: Buracos, Calçadas Quebradas, etc).

---

## 🛠 Tecnologias Utilizadas

**Core:**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) (Rápido, leve, sem SSR complexos).
- CSS Módulo / Inline Styles Dinâmicos.

**Mapas & Geoprocessamento:**
- [Leaflet](https://leafletjs.com/) e [React-Leaflet](https://react-leaflet.js.org/).
- [Leaflet.heat](https://github.com/Leaflet/Leaflet.heat) (Para o sistema de Heatmap administrativo).
- [Nominatim OpenStreetMap](https://nominatim.org/) (Geocoding Reverso Livre).
- IPAPI (Geolocalização Secundária).

**Backend & Data:**
- [Firebase Realtime Database](https://firebase.google.com/docs/database).
- [Firebase Storage](https://firebase.google.com/docs/storage) (Para imagens base64/files).

**Design & UI:**
- [Lucide-React](https://lucide.dev/) (Iconografia).
- [Recharts](https://recharts.org/) (Data Visualization).

---

## ⚙️ Como Instalar e Rodar Localmente

Certifique-se de que possui o **Node.js** (LTS) instalado em sua máquina.

1. **Clone o repositório**
   ```bash
   git clone https://github.com/ArthurVieira-eng/coimbramonitoramento.git
   cd coimbramonitoramento
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   > O terminal exibirá a URL local (geralmente `http://localhost:5173`).

---

## 🚢 Instruções de Deploy (Build)

O sistema foi preparado para rodar dentro de um subdiretório em sua hospedagem (ex: domínio.com.br/coimbra/).

1. **Gere os arquivos minificados**
   ```bash
   npm run build
   ```

2. **Upload**
   O comando acima gerará uma pasta chamada `dist/`. Basta pegar todo o conteúdo *dentro* da pasta `dist` e enviar para a raiz do servidor web da sua hospedagem (`public_html`, ou na respectiva pasta `/coimbra/` criada).
   *Nota: O arquivo `.htaccess` na pasta `public` garante o roteamento caso os links sejam acessados de fora da base raiz.*

---

## 🛡️ Notas de Segurança e API
O projeto utiliza instâncias públicas do Nominatim OSM, sendo inseridos cabeçalhos adequados `Accept-Language: pt-BR,pt;q=0.9` para priorização do idioma nativo nos mapeamentos geolocalizados. A API do Firebase atua diretamente na camada frontend. Certifique-se de que as Regras de Segurança (Security Rules) do Firebase Console estão restritas para aceitar escritas de clientes autenticados.
