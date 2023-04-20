module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        },
        unique: true
      },

      encryptedPassword: {
        type: Sequelize.DataTypes.BLOB,
        allowNull: false,
      },

      salt: {
        type: Sequelize.DataTypes.BLOB,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    }
  );

  // User.associate = function (models) {
  //   User.hasMany(models.Image, {
  //     foreignKey: { allowNull: false },
  //     onDelete: "CASCADE",
  //   });
  // };

  return User;
};