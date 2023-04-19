class ImageService {
  constructor(db) {
    this.client = db.sequelize;
    this.Image = db.Image;
  }

  async getAll(userId) {
    return await this.Image.findAll({
      where: {UserId: userId}
    });
  }

  async getOneById(imageId, userId) {
    return await this.Image.findOne({
      where: { id: imageId, UserId: userId },
    });
  }

  async create(imageId, userId, imageName, title, subtitle, text) {
    return await this.Image.create({
      id: imageId,
      name: imageName,
      title: title,
      subtitle: subtitle,
      description: text,
      UserId: userId
    });
  }

  async delete(imageId, userId) {
    return await this.Image.destroy({
      where:{id: imageId, UserId: userId},
    });
  }
}

module.exports = ImageService;
