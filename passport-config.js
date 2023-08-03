import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

export default function initialize(passport, getUserByUsername, getUserById) {
    const authenticateUser = async (username, password, done) => {
      const user = await getUserByUsername(username)
      if (user == null) {
        return done(null, false, { message: 'No user with that email' })
      }
      
      try {
        if (await bcrypt.compare(password, user.get('password'))) {
          return done(null, user)
        } else {
          return done(null, false, { message: 'Password incorrect' })
        }
      } catch (e) {
        return done(e)
      }
    }
  
    passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.get('_id')))
    passport.deserializeUser((id, done) => {
      return done(null, getUserById(id))
    })
  }
  