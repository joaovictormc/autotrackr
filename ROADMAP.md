# AutoTrackr — Roadmap de Funcionalidades

Registro de funcionalidades planejadas, levantadas durante o desenvolvimento.

---

## Em desenvolvimento / Próximas

### Despesas Avulsas
Registrar custos avulsos que não são manutenção: pedágios, estacionamento, multas, lavagem, etc.
- **Model:** `ExpenseRecord` (vehicleId, date, category enum, amount, notes)
- **Categorias:** PEDAGIO, ESTACIONAMENTO, MULTA, LAVAGEM, SEGURO, IMPOSTO, OUTROS
- **Escopo:** backend module + mobile sub-aba + web page `/expenses`
- **Relatórios:** incluir como 3ª categoria no gráfico de distribuição de despesas
- **Prioridade:** Alta — completa o quadro financeiro para motoristas de app

### Documentos do Veículo
Acompanhar documentos com data de vencimento e receber alertas automáticos.
- **Model:** `VehicleDocument` (vehicleId, type enum, expiresAt, amount, reminderDays default 30)
- **Tipos:** IPVA, LICENCIAMENTO, SEGURO_OBRIGATORIO, SEGURO_PRIVADO, CNH, OUTROS
- **Integração:** plugar no `RemindersModule` existente (e-mail/WhatsApp automático via cron)
- **Escopo:** backend module + mobile sub-aba + web page `/documents`
- **Prioridade:** Alta — diferencial competitivo para o mercado brasileiro

### Custo por km nos Relatórios
KPI crítico para motoristas profissionais: `(combustível + manutenção + despesas) / km rodados`.
- **Sem novo model** — métrica derivada no `reports.service.ts`
- **Escopo:** card adicional na aba Geral dos Relatórios (web + mobile)
- **Dependência:** Despesas Avulsas para cálculo completo
- **Prioridade:** Média

---

## Backlog

### Comparativo entre Veículos
Dashboard lado a lado com KPIs de dois ou mais veículos (km/L, custo/km, despesa mensal).

### Fotos e Anexos
Upload de fotos de recibos, notas fiscais ou danos em abastecimentos, manutenções e despesas.

### Integração Seguradora / DETRAN
Consulta automática de pontuação CNH e situação do veículo via API pública (Denatran/Senatran).

### Relatório de Imposto de Renda
Exportar comprovante de despesas dedutíveis (para autônomos e MEI) em formato aceito pela Receita Federal.

### App Widget (Android/iOS)
Widget de tela inicial mostrando km atual, último abastecimento e próxima manutenção.
