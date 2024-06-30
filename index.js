import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import methodOverride from 'method-override'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = process.env.PORT ?? 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(cookieParser())
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
  })
)

// Middlewares para analizar cuerpos de solicitudes
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride('_method'))

// Middleware para verificar si el usuario está autenticado
const verifiAutent = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login')
  }
  next()
}

const usuarios = []
const tareas = []

// Ruta para mostrar el formulario de registro
app.get('/register', (req, res) => {
  res.render('register')
})

// Ruta para manejar el registro de usuarios
app.post('/register', (req, res) => {
  const { usuario, password } = req.body
  console.log({ usuario, password })
  if (usuario && password) {
    usuarios.push({ usuario, password })
    res.redirect('/login')
  } else {
    res.redirect('/register') // Redirigir de vuelta a /register si los campos están vacíos
  }
})

// Ruta para mostrar el formulario de inicio de sesión
app.get('/login', (req, res) => {
  res.render('login')
})

// Ruta para manejar el inicio de sesión de usuarios
app.post('/login', (req, res) => {
  const { usuario, password } = req.body
  const usuarioEncontrado = usuarios.find(u => u.usuario === usuario && u.password === password)
  if (usuarioEncontrado) {
    req.session.user = usuarioEncontrado
    res.redirect('/tareas') // Redirigir a /tareas si el usuario se logueó correctamente
  } else {
    res.redirect('/login')
  }
})

// Ruta para manejar el cierre de sesión de usuarios
app.post('/logout', verifiAutent, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/tareas') // Redirige a /tareas si hay un error
    }
    res.redirect('/login') // Redirige al usuario de vuelta al login
  })
})

// Ruta para mostrar las tareas (solo si el usuario está autenticado)
app.get('/tareas', verifiAutent, (req, res) => {
  res.render('tareas', { tareas: tareas.filter(t => t.usuario === req.session.user.usuario) }) // Mostrar solo las tareas del usuario autenticado
})

// Ruta para manejar la creación de nuevas tareas (solo si el usuario está autenticado)
app.post('/tareas', verifiAutent, (req, res) => {
  const { descripcion } = req.body
  tareas.push({
    id: tareas.length + 1,
    descripcion,
    usuario: req.session.user.usuario
  })
  res.redirect('/tareas')
})

// Ruta para manejar la eliminación de tareas (solo si el usuario está autenticado)
app.delete('/tareas/:id', verifiAutent, (req, res) => {
  const { id } = req.params
  const tareaEncontrada = tareas.find(t => t.id === Number(id))

  if (tareaEncontrada) {
    tareas.splice(tareas.indexOf(tareaEncontrada), 1) // Elimina esa tarea del array
    return res.redirect('/tareas')
  } else {
    return res.status(404).json({ message: 'Tarea no encontrada' })
  }
})

// Ruta para manejar 404
app.use((req, res) => {
  res.status(404).render('404') // Renderizar la vista 404
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}/register`)
})
