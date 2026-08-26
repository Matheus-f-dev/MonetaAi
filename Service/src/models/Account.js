// Tipos de conta suportados e se contam como liquidez imediata pro "saldo disponível"
const TIPOS_CONTA = {
  corrente: { liquidez: true },
  poupanca: { liquidez: true },
  carteira: { liquidez: true },
  digital: { liquidez: true },
  conjunta: { liquidez: true },
  investimento: { liquidez: false }
};

class Account {
  constructor(data) {
    this._id = data.id;
    this._userId = data.userId;
    this._nome = (data.nome || '').trim();
    this._tipo = TIPOS_CONTA[data.tipo] ? data.tipo : 'corrente';
    this._saldoInicial = parseFloat(data.saldoInicial) || 0;
    this._instituicao = data.instituicao || '';
    this._cor = data.cor || 'roxo';
    this._liquidez = TIPOS_CONTA[this._tipo].liquidez;
    this._principal = Boolean(data.principal);
    this._ativo = data.ativo !== false;
    this._criadoEm = data.criadoEm || new Date().toISOString();
    this._atualizadoEm = data.atualizadoEm || null;

    this._validate();
  }

  get id() { return this._id; }
  get userId() { return this._userId; }
  get nome() { return this._nome; }
  get tipo() { return this._tipo; }
  get saldoInicial() { return this._saldoInicial; }
  get instituicao() { return this._instituicao; }
  get cor() { return this._cor; }
  get liquidez() { return this._liquidez; }
  get principal() { return this._principal; }
  get ativo() { return this._ativo; }

  _validate() {
    if (!this._nome) this._nome = 'Conta sem nome';
  }

  toJSON() {
    return {
      id: this._id,
      userId: this._userId,
      nome: this._nome,
      tipo: this._tipo,
      saldoInicial: this._saldoInicial,
      instituicao: this._instituicao,
      cor: this._cor,
      liquidez: this._liquidez,
      principal: this._principal,
      ativo: this._ativo,
      criadoEm: this._criadoEm,
      atualizadoEm: this._atualizadoEm
    };
  }

  // Formato de linha da tabela `accounts` (snake_case)
  toPersistence() {
    return {
      nome: this._nome,
      tipo: this._tipo,
      saldo_inicial: this._saldoInicial,
      instituicao: this._instituicao,
      cor: this._cor,
      liquidez: this._liquidez,
      principal: this._principal,
      ativo: this._ativo
    };
  }

  static TIPOS = TIPOS_CONTA;
}

module.exports = Account;
