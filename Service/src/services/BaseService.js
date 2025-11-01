class BaseService {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id) {
    return await this.model.findById(id);
  }

  async update(id, data) {
    const entity = await this.findById(id);
    if (!entity) throw new Error('Entidade não encontrada');
    return await entity.update(data);
  }

  async delete(id) {
    const entity = await this.findById(id);
    if (!entity) throw new Error('Entidade não encontrada');
    await entity.delete();
  }

  validateRequired(data, fields) {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`Campo obrigatório: ${field}`);
      }
    }
  }
}

module.exports = BaseService;