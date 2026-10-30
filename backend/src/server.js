require("dotenv").config();
const express=require("express");
const cors=require("cors");
const helmet=require("helmet");
const rate=require("express-rate-limit");
const path=require("path");
const fs=require("fs");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const pool=require("./config/db");
const {auth,role}=require("./middleware/auth");
const upload=require("./middleware/upload");
const {uploadFile}=require("./services/cloudinary");

const app=express();
const port=Number(process.env.PORT||3000);
const uploadDir=process.env.UPLOAD_DIR||"/app/uploads";
fs.mkdirSync(uploadDir,{recursive:true});
app.set("trust proxy",1);
app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(cors({origin:process.env.CORS_ORIGIN||"*"}));
app.use(express.json({limit:"3mb"}));
app.use(express.urlencoded({extended:true,limit:"3mb"}));
app.use("/api/auth/login",rate({windowMs:15*60*1000,max:80,standardHeaders:true,legacyHeaders:false}));
app.use("/uploads",express.static(path.resolve(uploadDir),{maxAge:"7d"}));

const tables={
  activities:["title","description","event_date","location","image_url","published"],
  studies:["title","summary","content","image_url","published"],
  testimonies:["author_name","title","content","image_url","published"],
  videos:["title","description","video_url","thumbnail_url","published"],
  songs:["title","artist","audio_url","cover_url","published"]
};
const valid=t=>Object.hasOwn(tables,t);
const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

async function storeUploadedFile(file){
  if(!file) return null;

  try{
    const result=await uploadFile(file.path,file.originalname);
    return result.secure_url;
  }finally{
    try{
      if(file.path && fs.existsSync(file.path)){
        fs.unlinkSync(file.path);
      }
    }catch(error){
      console.error("[UPLOAD CLEANUP]",error.message);
    }
  }
}

const DEFAULT_SETTINGS={
  site_name:"Ministerio Redención y Vida",
  site_subtitle:"Un lugar de fe, esperanza, redención y vida",
  hero_title:"Bienvenidos al Ministerio Redención y Vida",
  hero_text:"Creemos en la Palabra, en la restauración de las familias y en una vida transformada por Dios.",
  whatsapp_number:"18090000000",
  whatsapp_message:"Hola, quiero comunicarme con el Ministerio Redención y Vida.",
  donation_title:"Apoya la obra del Ministerio",
  donation_text:"Tu aporte ayuda a sostener las actividades y proyectos del ministerio.",
  donation_url:"",
  donation_cash_enabled:"true",
  donation_cash_title:"Donación en efectivo",
  donation_cash_text:"Puedes realizar tu aporte en efectivo durante los horarios de reunión de la iglesia. Consulta la ubicación y los horarios publicados.",
  donation_bank_enabled:"true",
  donation_bank_title:"Transferencia bancaria · República Dominicana",
  donation_bank_name:"",
  donation_bank_account_holder:"",
  donation_bank_account_type:"Cuenta corriente / ahorro",
  donation_bank_account_number:"",
  donation_bank_id:"",
  donation_bank_currency:"DOP",
  donation_bank_swift:"",
  donation_bank_instructions:"",
  donation_online_enabled:"false",
  donation_online_title:"Donación en línea",
  donation_online_text:"",
  donation_online_url:"",
  donation_other_enabled:"false",
  donation_other_title:"Otro medio de donación",
  donation_other_text:"",
  verse_enabled:"true",
  verse_title:"Versículo del día",
  verse_reference:"Juan 3:16",
  verse_text:"Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
  verse_explanation:"Este versículo presenta el amor de Dios como iniciativa de salvación y esperanza. La fe cristiana entiende que ese amor invita a recibir la vida nueva que Dios ofrece.",
  church_name:"Ministerio Redención y Vida",
  church_address:"",
  church_city:"",
  church_schedule:"",
  church_phone:"",
  church_map_url:"",
  church_directions_url:"",
  church_map_embed_url:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3776.420636200036!2d-69.74297042557068!3d18.823955782329392!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eafa1b9373ffab9%3A0x885ce4c706845c7f!2sCarr%20Monte%20Plata-Ant%C3%B3n%20S%C3%A1nchez%2C%2092000%2C%20Rep%C3%BAblica%20Dominicana!5e0!3m2!1ses-419!2sar!4v1791119599061!5m2!1ses-419!2sar",
  contact_email:"contacto@ministerio.local",
  facebook_url:"#",
  youtube_url:"#",
  instagram_url:"#"
};


async function ensureSchema(){
  // Safe, non-destructive migrations for installations that already have
  // a PostgreSQL volume from an earlier project version.
  const migrations = [
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE songs ADD COLUMN IF NOT EXISTS cover_url TEXT",
    "ALTER TABLE songs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE activities ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE studies ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE studies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()",
    "ALTER TABLE testimonies ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE testimonies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()"
  ];
  for (const sql of migrations) await pool.query(sql);
}

async function ensureSettings(){
  for(const [key,value] of Object.entries(DEFAULT_SETTINGS)){
    await pool.query("INSERT INTO site_settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING",[key,String(value)]);
  }
}

async function content(req,res,admin=false){
  const t=req.params.type;
  if(!valid(t))return res.status(404).json({message:"Contenido inválido"});
  const where=admin?"":"WHERE published=TRUE";
  const order=t==="activities"?"event_date ASC NULLS LAST,id DESC":"id DESC";
  const result=await pool.query(`SELECT * FROM ${t} ${where} ORDER BY ${order}`);
  const rows = result.rows.map((row) => {
    if (t === "videos" && /^(file:|[a-z]:[\\/])/i.test(String(row.video_url || "").trim())) {
      return { ...row, video_url: "" };
    }
    return row;
  });
  return res.json(rows);
}

app.get("/api/health",asyncHandler(async(_,res)=>{await pool.query("SELECT 1");res.json({status:"ok"})}));

app.post("/api/auth/login",asyncHandler(async(req,res)=>{
  const {email,password}=req.body||{};
  const u=(await pool.query("SELECT * FROM users WHERE LOWER(email)=LOWER($1) AND active=TRUE",[email||""])).rows[0];
  if(!u||!(await bcrypt.compare(password||"",u.password_hash)))return res.status(401).json({message:"Credenciales inválidas"});
  const token=jwt.sign({sub:String(u.id),email:u.email,role:u.role,name:u.name},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"8h"});
  res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role}});
}));

app.get("/api/auth/me",auth,asyncHandler(async(req,res)=>{
  const u=(await pool.query("SELECT id,name,email,role,active,created_at FROM users WHERE id=$1",[req.user.sub])).rows[0];
  if(!u)return res.status(401).json({message:"Usuario no encontrado"});
  res.json(u);
}));

app.get("/api/settings",asyncHandler(async(_,res)=>{
  const rows=(await pool.query("SELECT key,value FROM site_settings ORDER BY key")).rows;
  const settings={...DEFAULT_SETTINGS,...Object.fromEntries(rows.map(x=>[x.key,x.value]))};
  res.json(settings);
}));

app.put("/api/settings",auth,role("ADMIN","EDITOR"),asyncHandler(async(req,res)=>{
  const entries=Object.entries(req.body||{});
  for(const [k,v] of entries){
    if(!/^[a-zA-Z0-9_]{1,80}$/.test(k))continue;
    await pool.query(`INSERT INTO site_settings(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[k,String(v??"")]);
  }
  res.json({ok:true});
}));

app.get("/api/content/:type",asyncHandler((req,res)=>content(req,res,false)));
app.get("/api/content/admin/:type",auth,role("ADMIN","EDITOR"),asyncHandler((req,res)=>content(req,res,true)));

async function create(req,res){
  const t=req.params.type;
  if(!valid(t))return res.status(404).json({message:"Contenido inválido"});
  const d={...req.body};
  if(req.file){
    const uploadField=t==="songs"?"audio_url":t==="videos"?"video_url":"image_url";
    d[uploadField]=await storeUploadedFile(req.file);
  }
  const fields=tables[t].filter(k=>d[k]!==undefined);
  if(t==="songs"&&!d.audio_url)return res.status(400).json({message:"Carga un archivo de audio o indica audio_url"});
  if(t==="videos" && !d.video_url)return res.status(400).json({message:"Selecciona un video desde el dispositivo o indica una URL externa válida"});
  if(t==="videos" && /^(file:|[a-z]:[\\/])/i.test(String(d.video_url).trim()))return res.status(400).json({message:"No se puede guardar una ruta local de Windows. Selecciona el archivo con el botón de carga."});
  const values=fields.map(k=>k==="published"?d[k]!=="false"&&d[k]!==false:d[k]);
  const result=await pool.query(`INSERT INTO ${t}(${fields.join(",")}) VALUES(${fields.map((_,i)=>"$"+(i+1)).join(",")}) RETURNING *`,values);
  res.status(201).json(result.rows[0]);
}

async function update(req,res){
  const t=req.params.type;
  if(!valid(t))return res.status(404).json({message:"Contenido inválido"});
  const d=req.body||{},fields=[],values=[];

  // Never persist a local Windows file path or file:// URL as a public media URL.
  if(t==="videos" && d.video_url && /^(file:|[a-z]:[\\/])/i.test(String(d.video_url).trim())){
    delete d.video_url;
  }

  for(const k of tables[t]){
    if(d[k]!==undefined){
      // For videos, an empty URL during an edit means "keep the current video".
      if(t==="videos" && k==="video_url" && String(d[k]).trim()==="" && !req.file) continue;
      fields.push(`${k}=$${values.length+1}`);
      values.push(k==="published"?d[k]!=="false"&&d[k]!==false:d[k]);
    }
  }

  if(req.file){
    const k=t==="songs"?"audio_url":t==="videos"?"video_url":"image_url";
    const publicUrl=await storeUploadedFile(req.file);
    fields.push(`${k}=$${values.length+1}`);
    values.push(publicUrl);
  }

  if(!fields.length)return res.status(400).json({message:"Selecciona un archivo o realiza algún cambio."});
  values.push(req.params.id);
  const result=await pool.query(`UPDATE ${t} SET ${fields.join(",")},updated_at=NOW() WHERE id=$${values.length} RETURNING *`,values);
  if(!result.rows[0])return res.status(404).json({message:"Contenido no encontrado"});
  res.json(result.rows[0]);
}

app.post("/api/content/:type",auth,role("ADMIN","EDITOR"),upload.single("file"),asyncHandler(create));
app.put("/api/content/:type/:id",auth,role("ADMIN","EDITOR"),upload.single("file"),asyncHandler(update));
app.delete("/api/content/:type/:id",auth,role("ADMIN","EDITOR"),asyncHandler(async(req,res)=>{
  if(!valid(req.params.type))return res.status(404).json({message:"Contenido inválido"});
  const result=await pool.query(`DELETE FROM ${req.params.type} WHERE id=$1 RETURNING id`,[req.params.id]);
  if(!result.rows[0])return res.status(404).json({message:"Contenido no encontrado"});
  res.json({ok:true});
}));

app.get("/api/dashboard",auth,role("ADMIN","EDITOR"),asyncHandler(async(_,res)=>{
  const out={};
  for(const t of [...Object.keys(tables),"users","quizzes"])out[t]=(await pool.query(`SELECT COUNT(*)::int c FROM ${t}`)).rows[0].c;
  res.json(out);
}));

app.get("/api/users",auth,role("ADMIN"),asyncHandler(async(_,res)=>res.json((await pool.query("SELECT id,name,email,role,active,created_at FROM users ORDER BY id DESC")).rows)));
app.post("/api/users",auth,role("ADMIN"),asyncHandler(async(req,res)=>{
  const {name,email,password,role:r="EDITOR"}=req.body||{};
  if(!name||!email||!password)return res.status(400).json({message:"Nombre, email y contraseña son obligatorios"});
  if(!["ADMIN","EDITOR"].includes(r))return res.status(400).json({message:"Rol inválido"});
  const h=await bcrypt.hash(password,12);
  try{res.status(201).json((await pool.query("INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,active,created_at",[name,email,h,r])).rows[0]);}
  catch(e){res.status(e.code==="23505"?409:500).json({message:e.code==="23505"?"Email ya registrado":"Error creando usuario"});}
}));
app.delete("/api/users/:id",auth,role("ADMIN"),asyncHandler(async(req,res)=>{if(String(req.user.sub)===String(req.params.id))return res.status(400).json({message:"No puedes eliminarte"});await pool.query("DELETE FROM users WHERE id=$1",[req.params.id]);res.json({ok:true})}));

async function loadQuizzes(published){
  const qs=(await pool.query(`SELECT * FROM quizzes ${published?"WHERE published=TRUE":""} ORDER BY id DESC`)).rows;
  for(const q of qs){
    q.questions=(await pool.query("SELECT id,question FROM quiz_questions WHERE quiz_id=$1 ORDER BY sort_order,id",[q.id])).rows;
    for(const x of q.questions)x.options=(await pool.query("SELECT id,option_text,is_correct FROM quiz_options WHERE question_id=$1 ORDER BY sort_order,id",[x.id])).rows.map(o=>({...o,is_correct:!!o.is_correct}));
  }
  return qs;
}
app.get("/api/quizzes",asyncHandler(async(_,res)=>res.json(await loadQuizzes(true))));
app.get("/api/quizzes/admin",auth,role("ADMIN","EDITOR"),asyncHandler(async(_,res)=>res.json(await loadQuizzes(false))));
app.post("/api/quizzes",auth,role("ADMIN","EDITOR"),asyncHandler(async(req,res)=>{
  const {title,description,published=true,questions=[]}=req.body||{};
  if(!title)return res.status(400).json({message:"El título es obligatorio"});
  if(!Array.isArray(questions))return res.status(400).json({message:"Preguntas inválidas"});
  const c=await pool.connect();
  try{
    await c.query("BEGIN");
    const q=(await c.query("INSERT INTO quizzes(title,description,published) VALUES($1,$2,$3) RETURNING *",[title,description||"",published])).rows[0];
    for(let i=0;i<questions.length;i++){
      const x=(await c.query("INSERT INTO quiz_questions(quiz_id,question,sort_order) VALUES($1,$2,$3) RETURNING id",[q.id,questions[i].question,i])).rows[0];
      for(let j=0;j<(questions[i].options||[]).length;j++){const o=questions[i].options[j];await c.query("INSERT INTO quiz_options(question_id,option_text,is_correct,sort_order) VALUES($1,$2,$3,$4)",[x.id,o.option_text,!!o.is_correct,j]);}
    }
    await c.query("COMMIT");res.status(201).json(q);
  }catch(e){await c.query("ROLLBACK");throw e;}finally{c.release();}
}));
app.delete("/api/quizzes/:id",auth,role("ADMIN","EDITOR"),asyncHandler(async(req,res)=>{await pool.query("DELETE FROM quizzes WHERE id=$1",[req.params.id]);res.json({ok:true})}));

app.use((err,req,res,next)=>{
  console.error(`[API ERROR] ${req.method} ${req.originalUrl}`,err);
  if(res.headersSent)return next(err);
  const status=err.code==="LIMIT_FILE_SIZE"?413:(err.message==="Tipo de archivo no permitido"?400:500);
  res.status(status).json({message:status===500?"Error interno del servidor":err.message});
});

async function seed(){
  const email=process.env.ADMIN_EMAIL||"admin@ministerio.local";
  const pass=process.env.ADMIN_PASSWORD||"CambiaEstaClaveAdmin123!";
  const name=process.env.ADMIN_NAME||"Administrador Principal";
  const h=await bcrypt.hash(pass,12);
  await pool.query(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'ADMIN') ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='ADMIN',active=TRUE`,[name,email,h]);
  await ensureSettings();
}

ensureSchema().then(seed).then(()=>app.listen(port,()=>console.log(`API Ministerio Redención y Vida en ${port}`))).catch(e=>{console.error("FATAL startup error:",e);process.exit(1)});
