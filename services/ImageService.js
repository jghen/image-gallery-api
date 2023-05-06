class ImageService {
  constructor(db) {
    this.client = db.sequelize;
    this.Image = db.Image;
  }

  async getAll() {
    return await this.Image.findAll({
      where: {},
    });
  }

  async getOneById(imageId) {
    return await this.Image.findOne({
      where: { id: imageId },
    });
  }

  async create(imageId, imageHash, title, subtitle, text) {
    try {
      return await this.Image.create({
        id: imageId,
        name: imageHash,
        title: title,
        subtitle: subtitle,
        description: text,
      });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async deleteOne(imageId) {
    console.log('delete db', imageId, typeof imageId)
    
    try {
       return await this.Image.destroy({
        where: { id: imageId },
      });
    } catch (error) {
      console.log('Error:',error.message);
      return error.message;
    }
    
    
  }
}

module.exports = ImageService;
