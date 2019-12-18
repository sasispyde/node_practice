// Library import section
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const { Validator } = require('node-input-validator');
const md5 = require('md5');
const session = require('express-session');
const MongoClient = require('mongodb').MongoClient;

var dbo;
app.set('view engine', 'ejs');

var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(publicDir));

app.use(bodyParser.urlencoded({
    extended: true,
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(bodyParser.json());
app.use(session({secret: 'ssshhhhh',resave: true,
    saveUninitialized: true}));
sess=session;


// MongoDB Connnection 

var url = "mongodb://192.168.2.25:27017/Api";

MongoClient.connect(url,{ useUnifiedTopology: true , useNewUrlParser: true }, function(err, db) {
  if (err) throw err;
  dbo = db.db("sasi_ci");
});


// Responce Section

app.get('/',(req,res)=>{

	if(req.session.username)
	{
		res.redirect("/home");
	}
	else
	{
		res.render('signin',{'title':"Signin"});
	}
});

app.post('/',(req,res)=>{
	var user =req.body.username;
	var password = md5(req.body.password);

	dbo.collection("login").findOne({"name":user,"password":password},function(err,result)
	{
		if(err){
			throw err;
		}
		else{
			if(result!=null && "name" in result)
			{
				req.session.username=user;
				res.redirect('/home');
			}
			else
			{	
				res.render('signin',{'title':"Signin",'error':{'invalid':{
		    	'message' : "Invalid Login Details"
		    	}}});
			}
		}
	});
});

app.get('/home', (req, res) => {
	if(req.session.username)
	{
		res.render('home',{'title':"Home"});
	}
	else
	{
		res.redirect('/');
	}
});

app.get('/contact',(req,res) => {
	if(req.session.username)
	{
		res.render('about',{'title':"Contact"});
	}
	else
	{
		res.redirect('/');
	}
});

app.get('/gallery',(req,res) => {
	if(req.session.username)
	{
		dbo.collection("images").find({}).toArray(function(err,result){

			if(err){
				console.log(err);
			}
			else{
				if(result!=null&&Object.keys(result).length>0){
					console.log(result);
					res.render('gallery',{'title':"Gallery",'result':result});
				}
			}
		});
	}
	else
	{
		res.redirect('/');
	}
});

app.get('/artist',(req,res) => {

	if(req.session.username)
	{
		res.render('artist',{'title':"Artist"});
	}
	else
	{
		res.redirect('/');
	}
});

app.get('/shop',(req,res) => {

	// if(req.session.username)
	// {
		dbo.collection("images").find({}).toArray(function(err,result){
		
			if(err){
				console.log(err);
			}
			else{
				console.log(req.body);
				res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
				res.send(result);
				// if(result!=null&&Object.keys(result).length>0){
				// 	res.render('shop',{'title':"Shop",'result':result});
				// }
			}
		});
	// }
	// else
	// {
	// 	res.redirect('/');
	// }
});

app.get('/news',(req,res) => {

	if(req.session.username)
	{
		res.render('news',{'title':"News"});
	}
	else
	{
		res.redirect('/');
	}
});


app.get('/checkout',(req,res) => {

	if(req.session.username)
	{
		res.render('checkout',{'title':"Checkout"});
	}
	else
	{
		res.redirect('/');
	}
});

app.post('/testing',(req,res) => {
	var data = Object.keys(req.body);
	var form_data=JSON.parse(data[0]); 
	var responce = {status:0,error:"Invalid mobile number",form_data:form_data};
	res.send(responce);
});

app.get('/logout', function(req, res){
   req.session.destroy(function(){
   		res.redirect('/');
   });
});

app.post('/contact',(req,res)=>{

	const v = new Validator(req.body, {
	    email: 'required|email',
	    name : 'required|alpha|minLength:4|maxLength:50',
	    number: 'required|integer|maxLength:16'
	});

	v.check().then((matched) => {
	    if (!matched) {
	      res.status(422).render('about',{'title':"Contact",'inputs':req.body,'error':v.errors});
	    }
	    else
	    {
		    var myobj = { name: req.body.name, email: req.body.email,phone:req.body.number};
	    	dbo.collection('contact_data').findOne({email : req.body.email},
	    	function(err,result){
		    	if(err) 
		    	{
		    		throw err;
		    	}
		    	else
		    	{
		    		if(result==null)
		    		{
		    			dbo.collection("contact_data").insertOne(myobj, function(err, res) {
							if (err) throw err;
							});
						res.redirect('/home');
		    		}
		    		else
		    		{
		    			res.render('about',{'title':"Contact",'inputs':req.body,'error':{'email':{
		    					'message' : "The Email is already Exixts"
		    			}}});
		    		}
		    	}
	    	});
	    }
	});
});


// Listening Section...

app.listen(3014, () => {
  console.log('The server is listening.....');
});