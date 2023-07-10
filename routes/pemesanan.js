const express = require("express");
const bodyParser = require("body-parser");
const { Op } = require("sequelize");
const auth = require("../auth");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const model = require("../models/index");
const access = require('../akses')
const pemesanan = model.pemesanan;
const detail_pemesanan = model.detail_pemesanan
const tipe_kamar = model.tipe_kamar
const kamar = model.kamar

app.get("/getAllData", auth, async (req, res) => {
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  await pemesanan
    .findAll({
      include: [
        {
          model: model.tipe_kamar,
          as: "tipe_kamar",
        },
        {
          model: model.user,
          as: "user",
        },
        {
          model: model.detail_pemesanan,
          as: "detail_pemesanan",
        },
      ],
    })
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
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  await pemesanan
    .findByPk(req.params.id, {
      include: [
        {
          model: model.tipe_kamar,
          as: "tipe_kamar",
        },
        {
          model: model.user,
          as: "user",
        },
        {
          model: model.detail_pemesanan,
          as: "detail_pemesanan",
        },
      ],
    })
    .then((result) => {
      if (result) {
        res.status(200).json({
          status: "success",
          data: result,
        });
      } else {
        res.status(404).json({
          status: "error",
          message: "data not found",
        });
      }
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.post("/create", auth, async (req, res) => {
  let granted = await access.tamu(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const body = {
    nomor_pemesanan: "BOOK-" + Date.now(),
    nama_pemesan: req.body.nama_pemesan,
    email_pemesan: req.body.email_pemesan,
    tgl_check_in: req.body.tgl_check_in,
    tgl_check_out: req.body.tgl_check_out,
    nama_tamu: req.body.nama_tamu,
    jumlah_kamar: req.body.jumlah_kamar,
    id_tipe_kamar: req.body.id_tipe_kamar,
    id_user: req.body.id_user,
    status_pemesanan: req.body.status_pemesanan,
    id_kamar: req.body.id_kamar
  }
  const id_kamar = body.id_kamar
  body.jumlah_kamar = id_kamar.length
  body.tgl_pemesanan = new Date().toISOString().substr(0, 10)
  const tgl_psn = body.tgl_pemesanan
  
  const result = await pemesanan.create(body)
  console.log(result)

  let tgl_check_in = new Date(body.tgl_check_in)
  let tgl_check_out = new Date(body.tgl_check_out)
  let jumlah_hari = (tgl_check_out.getTime() - tgl_check_in.getTime()) / (1000 * 3600 * 24)

  const id_pemesanan = result.id_pemesanan

  let result_detail = []

  const id_tipe_kamar = body.id_tipe_kamar
  const harga = await tipe_kamar.findOne({ attributes: ['harga'], where: { id_tipe_kamar } })

  for (let i = 0; i < id_kamar.length; i++) {
    let tgl_terisi = tgl_check_in
    for (let j = 0; j < jumlah_hari; j++) {
      result_detail.push({
        id_pemesanan: id_pemesanan,
        id_kamar: id_kamar[i],
        tgl_akses: tgl_terisi,
        harga: harga.harga
      })
      tgl_terisi = new Date(tgl_terisi.getTime() + 86400000)
    }
  }
  await detail_pemesanan.bulkCreate(result_detail)
  res.send(result)
});

app.delete("/delete/:id_pemesanan", auth, async (req, res) => {
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const param = { id_pemesanan: req.params.id_pemesanan };
  detail_pemesanan
    .destroy({where:param})
  pemesanan
    .destroy({ where: param })
    .then((result) => {
      if (result) {
        res.status(200).json({
          status: "success",
          message: "pemesanan has been deleted",
          data: param,
        });
      } else {
        res.status(404).json({
          status: "error",
          message: "data not found",
        });
      }
    })
    .catch((error) => {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
    });
});

app.patch("/edit/:id_pemesanan", auth, async (req, res) => {
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const param = { id_pemesanan: req.params.id_pemesanan };
  const data = {
    nama_pemesan: req.body.nama_pemesan,
    email_pemesan: req.body.email_pemesan,
    nama_tamu: req.body.nama_tamu,
    id_user: req.body.id_user,
    status_pemesanan: req.body.status_pemesanan,
  }
  pemesanan.findOne({ where: param }).then((result) => {
    if (result) {
      pemesanan
        .update(data, { where: param })
        .then((result) => {
          res.status(200).json({
            status: "success",
            message: "data has been updated",
            data: {
              id_pemesanan: param.id_pemesanan,
              nomor_kamar: data.nomor_kamar,
              id_tipe_kamar: data.id_tipe_kamar,
              nama_pemesan: data.nama_pemesan,
              email_pemesan: data.email_pemesan,
              tgl_check_in: data.tgl_check_in,
              tgl_check_out: data.tgl_check_out,
              nama_tamu: data.nama_tamu,
              jumlah_kamar: data.jumlah_kamar,
              id_tipe_kamar: data.id_tipe_kamar,
              id_user: data.id_user,
              status_pemesanan: data.status_pemesanan,
            },
          });
        })
        .catch((error) => {
          res.status(400).json({
            status: "error",
            message: error.message,
          });
        });
    } else {
      res.status(404).json({
        status: "error",
        message: "data not found",
      });
    }
  });
});

app.get("/search/:nama_tamu", auth, async (req, res) => {
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  pemesanan
    .findAll({
      where: {
        [Op.or]: [
          {
            nama_tamu: {
              [Op.like]: "%" + req.params.nama_tamu + "%",
            },
          },
        ],
      },
      include: [
        {
          model: model.tipe_kamar,
          as: "tipe_kamar",
        },
        {
          model: model.user,
          as: "user",
        },
        {
          model: model.detail_pemesanan,
          as: "detail_pemesanan",
        },
      ],
    })
    .then((result) => {
      res.status(200).json({
        status: "success",
        message: "result of nama tamu " + req.params.nama_tamu + "",
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

app.get("/filter/check_in/:tgl_check_in", auth, async (req, res) => {
  let granted = await access.resepsionis(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  pemesanan
    .findAll({
      where: {
        tgl_check_in: req.params.tgl_check_in,
      },
      include: [
        {
          model: model.tipe_kamar,
          as: "tipe_kamar",
        },
        {
          model: model.user,
          as: "user",
        },
        {
          model: model.detail_pemesanan,
          as: "detail_pemesanan",
        },
      ],
    })
    .then((result) => {
      res.status(200).json({
        status: "success",
        message: "result of tgl check in " + req.params.tgl_check_in + "",
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

app.post("/searchByEmailAndNumber", auth, async (req, res) => {
  let granted = await access.ResepsionisTamu(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  pemesanan
    .findAll({
      where: {
        email_pemesan: req.body.email,
        nomor_pemesanan: req.body.nomor_pemesanan,
      },
      include: [
        {
          model: model.tipe_kamar,
          as: "tipe_kamar",
        },
        {
          model: model.user,
          as: "user",
        },
      ],
    })
    .then((result) => {
      res.status(200).json({
        status: "success",
        message:
          "result of email pemesan " +
          req.params.email_pemesan +
          " and nomor pemesanan " +
          req.params.nomor_pemesanan +
          "",
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

app.get("/available", auth, async (req, res) => {
  let granted = await access.ResepsionisTamu(req);
  if (!granted.status) {
    return res.status(403).json(granted.message);
  }
  const options = {
    // order: [
    //     ['nomor', 'ASC']
    // ],
    attributes: ['id_tipe_kamar', 'nama_tipe_kamar'],
    include: [
      {
        model: kamar,
        as: "kamar",
        attributes: ["nomor_kamar"],
        required: false,
        where: {},
        include: [
          {
            model: detail_pemesanan,
            as: "detail_pemesanan",
            attributes: ["tgl_akses"],
            required: false,
            where: {
              ['tgl_akses']: {
              }
            }
          },
        ],
      },
    ],
    where: {}
  }
  const { id_tipe_kamar, C_out, C_in } = req.query
  
  if (C_in && C_out) {
    const dateOut = new Date(C_out)
    dateOut.setDate(dateOut.getDate() - 1)
    const tgl_check_out = dateOut.toISOString().slice(0, 10)

    options.include[0].include[0].where.tgl_akses = {
      [Op.between]: [C_in, tgl_check_out]
    }
  }
  if (id_tipe_kamar) {
    options.where = {
      ['id_tipe_kamar']: id_tipe_kamar,
      "$kamar->detail_pemesanan.tgl_akses$": { [Op.is]: null }
    }
  }
  else {
    options.where = {
      "$kamar->detail_pemesanan.tgl_akses$": { [Op.is]: null }
    }
  }
  const result = await tipe_kamar.findAll(options);
  res.json(result)
})
module.exports = app;