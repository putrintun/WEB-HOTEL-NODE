const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const auth = require("../auth");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "UKKhotel";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const model = require("../models/index");
const access = require("../akses");
const user = model.user;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images/user");
  },
  filename: (req, file, cb) => {
    cb(null, "user-" + Date.now() + path.extname(file.originalname));
  },
});
let upload = multer({ storage: storage });

app.get("/getAllData", auth, async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  await user
    .findAll()
    .then((result) => {
      res.status(200).json({
        status: "success",
        data: result,
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.get("/getById/:id", auth, async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  await user
    .findByPk(req.params.id)
    .then((result) => {
      res.status(200).json({
        status: "success",
        data: result,
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.post("/register", upload.single("foto"), auth, async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const data = {
    nama_user: req.body.nama_user,
    password: bcrypt.hashSync(req.body.password, 10),
    email: req.body.email,
    role: req.body.role,
    foto: req.file.filename,
    resultArr: {},
  };
  await user
    .findAll({
      where: {
        [Op.or]: [{ email: data.email }],
      },
    })
    .then((result) => {
      resultArr = result;
      if (resultArr.length > 0) {
        res.status(400).json({
          status: "error",
          message: "email already exist",
        });
      } else {
        user
          .create(data)
          .then((result) => {
            res.status(200).json({
              status: "success",
              message: "user has been registered",
              data: result,
            });
          })
          .catch((error) => {
            res.status(400).json({
              status: "error",
              message: error.message,
            });
          });
      }
    });
});

app.post("/login", async (req, res) => {
  const data = await user.findOne({ where: { email: req.body.email } });
  if (data) {
    const validPassword = await bcrypt.compare(
      req.body.password,
      data.password
    );
    if (validPassword) {
      let payload = JSON.stringify(data);
      let token = jwt.sign(payload, SECRET_KEY);
      res.status(200).json({
        status: "success",
        logged: true,
        message: "valid password",
        token: token,
        data: data,
      });
    } else {
      res.status(400).json({
        status: "error",
        message: "invalid Password",
      });
    }
  } else {
    res.status(400).json({
      status: "error",
      message: "user does not exist",
    });
  }
});

app.delete("/delete/:id_user", auth, async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const param = { id_user: req.params.id_user };
  user.findOne({ where: param }).then((result) => {
    let oldFileName = result.foto;
    let dir = path.join(__dirname, "../public/images/user/", oldFileName);
    fs.unlink(dir, (err) => err);
  });
  user
    .destroy({ where: param })
    .then((result) => {
      res.json({
        status: "success",
        message: "user has been deleted",
        data: param,
      });
    })
    .catch((error) => {
      res.json({
        status: "error",
        message: error.message,
      });
    });
});

app.patch("/edit/:id_user", auth, upload.single("foto"), async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const param = { id_user: req.params.id_user };
  const data = {
    nama_user: req.body.nama_user,
    password: req.body.password,
    email: req.body.email,
    role: req.body.role,
    resultArr: {},
  };
  if (req.file) {
    user.findOne({ where: param }).then((result) => {
      let oldFileName = result.foto;
      let dir = path.join(__dirname, "../public/images/user/", oldFileName);
      fs.unlink(dir, (err) => err);
    });
    data.foto = req.file.filename;
  }
  if (data.password) {
    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
  }
  if (data.email) {
    user
      .findAll({
        where: {
          [Op.or]: [{ email: data.email }],
        },
      })
      .then((result) => {
        resultArr = result;
        if (resultArr.length > 0) {
          res.status(400).json({
            status: "error",
            message: "email already exist",
          });
        }
      });
  }
  user
    .update(data, { where: param })
    .then((result) => {
      res.status(200).json({
        status: "success",
        message: "user has been updated",
        data: {
          id_user: param.id_user,
          nama_user: data.nama_user,
          email: data.email,
          role: data.role,
          foto: data.foto,
        },
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.get("/search/:nama_user", auth, async (req, res) => {
  let granted = await access.admin(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  user
    .findAll({
      where: {
        [Op.or]: [
          { nama_user: { [Op.like]: "%" + req.params.nama_user + "%" } },
        ],
      },
    })
    .then((result) => {
      res.status(200).json({
        status: "success",
        message: "user data",
        data: result,
      });
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});
 
module.exports = app;
 