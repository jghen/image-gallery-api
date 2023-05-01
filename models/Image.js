module.exports = (sequelize, Sequelize) => {
  const Image = sequelize.define(
    "Image",
    {
      id: {
        type: Sequelize.DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      subtitle: {
        type: Sequelize.DataTypes.STRING,
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
      },
      
    },
    {
      timestamps: false,
    }
  );

  // Image.associate = function (models) {
  //   Image.belongsTo(models.User, {
  //     foreignKey: { allowNull: false },
  //     onDelete: "CASCADE",
  //   });
  // };

  return Image;
};