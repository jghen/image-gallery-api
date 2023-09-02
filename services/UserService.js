class UserService {
  constructor(db) {
    this.client = db.sequelize;
    this.User = db.User;
  }

  async getOneByEmail(email) {
    return await this.User.findOne({
      where: { email: email },
    });
  }

  async getOneById(userId) {
    return await this.User.findOne({
      where: { id: userId },
    });
  }

  async create(name, email, encryptedPassword, salt, refreshToken) {
    return await this.User.create({
      name: name,
      email: email,
      encryptedPassword: encryptedPassword,
      salt: salt,
      refreshToken: refreshToken,
    });
  }

  async setRefreshToken(refreshToken) {
    const user = await this.User.findOne({
      where: { email: email },
    });

    if (!user) return null;

    const updated = await user
      .set({
        refreshToken: refreshToken,
      })
      .save();

    return user.reload();
  }
}

module.exports = UserService;
