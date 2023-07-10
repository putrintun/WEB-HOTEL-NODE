const deniedMessage = {
    message: "Access Denied",
    err: null
}
  
const admin = async (req) => {
    const role = req.user.role
    console.log(role)
    if (role !== "admin") {
      return ({
        status: false,
        message: deniedMessage
      })
    }
    return ({
      status: true,
      message: "granted"
    })
}

const resepsionis = async (req) => {
    const role = req.user.role
    console.log(role)
    if (role !== "resepsionis") {
      return ({
        status: false,
        message: deniedMessage
      })
    }
    return ({
      status: true,
      message: "granted"
    })
}

const tamu = async (req) => {
    const role = req.user.role 
    console.log(role)
    if (role !== "tamu") {
      return ({
        status: false,
        message: deniedMessage
      })
    }
    return ({
      status: true,
      message: "granted"
    })
}

const AdminTamu = async (req) => {
    const role = req.user.role 
    console.log(role)
    if (role === "admin" || role === "tamu") {
      return ({
        status: true,
        message: "granted"
      })
    }
    return ({
      status: false,
      message: deniedMessage
    })
}

const ResepsionisTamu = async (req) => {
    const role = req.user.role 
    console.log(role)
    if (role === "resepsionis" || role === "tamu") {
      return ({
        status: true,
        message: "granted"
      })
    }
    return ({
      status: false,
      message: deniedMessage
    })
}

module.exports = {
    admin,
    resepsionis,
    tamu,
    AdminTamu,
    ResepsionisTamu
}
