class ImageService {
  constructor(db) {
    this.client = db.sequelize;
    this.Image = db.Image;
  }

  async getAll() {
    return await this.Image.findAll({
      where: {}
    });
  }

  async getOneById(imageId) {
    return await this.Image.findOne({
      where: { id: imageId},
    });
  }

  async create(imageId, location, imageName, title, subtitle, text) {
    return await this.Image.create({
      id: imageId,
      location: location,
      name: imageName,
      title: title,
      subtitle: subtitle,
      description: text,
    });
  }

  async delete(imageId) {
    return await this.Image.destroy({
      where:{id: imageId},
    });
  }
}

module.exports = ImageService;
