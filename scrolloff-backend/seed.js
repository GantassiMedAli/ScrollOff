import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new mongoose.Schema({ nom: String, email: String });
const User = mongoose.model('User', userSchema);

async function main(){
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  await User.deleteMany({});
  await User.create([{nom:'Test1', email:'t1@ex.com'}, {nom:'Test2', email:'t2@ex.com'}]);
  console.log('Seed done');
  process.exit();
}
main().catch(e=>{ console.error(e); process.exit(1); });
