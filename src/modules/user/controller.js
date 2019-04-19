import User from './model';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

class UserController {
  async store(req, res) {
    try {
      if (req.body.password !== req.body.password2)
        return res
          .status(400)
          .json({ password: 'As senhas não coincidem.' });
      const { name, email, password } = req.body;
      const checkUser = await User.find({ email });
      if (checkUser.length > 0)
        return res
          .status(400)
          .json({ email: 'Este e-mail já foi cadastrado.' });
      const newUser = { name, email, password };
      const salts = 10;
      const hashedPassword = await new Promise((resolve, reject) => {
        bcrypt.hash(newUser.password, salts, function(err, hash) {
          if (err) reject(err);
          resolve(hash);
        });
      });
      newUser.password = hashedPassword;
      const user = await User.create(newUser);
      return res.json(user);
    } catch (err) {
      console.log(err);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ name: 'Usuário ' + user.name + ' não encontrado.' });
      const passwordMatch = await bcrypt.compareSync(password, user.password);
      if (!passwordMatch)
        return res.status(400).json({ password: 'Senha incorreta.' });
      const payload = {
        id: user.id,
        email: user.email,
        name: user.name
      };
      const token = await jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: 3600
      });
      return res.json({
        success: true,
        token: `Bearer ${token}`
      });
    } catch (err) {
      console.log(err);
    }
  }

  async update(req, res) {
    try {
      if ('old_password' in req.body) {
        var user = await User.findById(req.params.id);
        const { old_password, password, confirm_password } = req.body;
        const pass_ok = await bcrypt.compare(old_password, user.password);
        if (!pass_ok) return res.json({ password: 'Senha incorreta.' });
        if (password !== confirm_password)
          return res.json({ password: 'As senhas não coincidem.' });

        delete req.body['old_password'];
        delete req.body['confirm_password'];
        req.body['password'] = await bcrypt.hash(password, 10);
      }
      if ('email' in req.body) {
        const { email } = req.body;
        const checkUser = await User.find({ email });
        if (checkUser.length > 0)
          return res
            .status(400)
            .json({ email: 'Este e-mail já foi registrado.' });
      }
      user = await User.findOneAndUpdate(
        { _id: req.params.id },
        { $set: req.body },
        { useFindAndModify: false, new: true }
      );
      return res.json(user);
    } catch (err) {
      console.log(err);
    }
  }

  async show(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (user) {
        return res.json(user);
      } else {
        return res
          .status(400)
          .json({ name: 'Usuário ' + user.name + ' não encontrado' });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async showAll(req, res) {
    try {
      const users = await User.find();
      return res.json(users);
    } catch (err) {
      console.log(err);
    }
  }

  async delete(req, res) {
    try {
      const user = await User.findOneAndDelete({ _id: req.params.id });
      if (user) {
        return res.json(user);
      } else {
        return res
          .status(400)
          .json({ name: 'Usuário ' + user.name + ' não encontrado' });
      }
    } catch (err) {
      console.log(err);
    }
  }
}

const userController = new UserController();
export default userController;
