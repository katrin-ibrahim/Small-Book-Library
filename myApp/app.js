
//var express = require('express');
var path = require('path');
var fs = require('fs');


//https://www.youtube.com/watch?v=OH6Z0dJ_Huk&list=WL&index=1&t=150s&ab_channel=CodeRealm
var express = require('express');
const session = require ('express-session');
const app = express();

//maxage specifies time until cookie expires
//cookie.samesite : browser only accepts the cookie if it's coming from the same 

//if no maxAge is set the cookie will expire when browser is closed
//path is automatically set to '/' if not specified
//const inProd = NODE_ENV === 'production'
app.use(session({
  //session name environment variable
  name : 'sid',
  resave: false,
  saveUninitialized : false, //forces a session that's unitialized (empty) to be saved if true
  secret: 'sshh!!Quiet,it', //prevents the session from being hijacked needs to be any rando string 
  cookie:{
    sameSite:true,
  //  secure: inProd
  }
}))
const redirectLogin = (req , res ,next) => {
  if(!req.session.userId){
    res.redirect('/');
    //res.render({msg1: "Please login first to acces this page"});
  }
  else{
    next()
  }
}



//if process is on heroku process env var is defined so we enter if
//else it's on local server and not on rando port, it's on port 3000
if(process.env.PORT){
  app.listen(process.env.PORT,function(){console.log('Server Started')});
}
else{
  app.listen(3000,function(){console.log('Server started on port 3000')});
}

 
var uname; // global var to acces user who just logged in
var addBookMessage;



// view engine setup
//if you want to find the wepbage follow this path then go to views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


//user requesting login page (website page 1)
app.get('/', function(req,res){
  const {userId} = req.session
  res.render('login',{msg1:""})
});


//user requesting reg page 
app.get('/registration' ,function(req,res){
  res.render('registration',{msg:""});
});

//server response after user clicks register
app.post('/register', function(req,res){
  // parses string returned from json file to turn it into array so we can access it's elements 
  var arr = JSON.parse(fs.readFileSync("users.json")); 
  var name = req.body.username;
  var password = req.body.password;
  //checking if username or pass are empty
  if(name=="" || password==""){
    res.render('registration',{msg: "Fields cannot be empty"});
  }  
  //checking if username already exists
  //if it is unique , create user obj and push it into arr 
  else if (checkUnique(name)){
    var x = {name: name, password: password,books:[]};
    arr.push(x);
    var y = JSON.stringify(arr);
    fs.writeFileSync("users.json", y);
    res.redirect('/'); //reg succesful go to login
  }
 else{
  res.render('registration',{msg:"Please choose another username as this username already exists"});
}});


//server response to user clicking login
app.post('/',function(req,res){
  var arr =JSON.parse(fs.readFileSync("users.json"));
  var uname = req.body.username;
  var password = req.body.password;

  //check fields empty
  if(uname=="" || password==""){
    res.render('login',{msg1: "Fields cannot be empty"});
  } 
  //username not unique i.e:exists   
  else if (!checkUnique(uname)){
    for(var i = 0;i<arr.length;i++){
      if(uname==arr[i].name){ //found the user
        if(password==arr[i].password){ //check if passes match
          req.session.userId = uname;  //if the user is found and the passes match then we place the username inside the session variable
          res.render('home');  // go to home page
        }
        else{
          res.render('login',{msg1:"Password is incorrect"});
        }
      }
    }
  }
  //username unique i.e: doesn't exist in .json file
 else{
  res.render('login',{msg1:"User not found"});
}

});


app.get('/readlist',redirectLogin,function(req,res){
   
  var arr =JSON.parse(fs.readFileSync("users.json")); //acessing json to retrieve user
  
    res.locals.result = getUser(req.session.userId).books;
    res.render('readlist');
});
  
app.get('/novel',redirectLogin,function(req,res){
  
  res.render('novel',{msg1:""});

 
});
  
app.get('/flies',redirectLogin,function(req,res){
  
    res.render('flies',{msg1:""});
  
 
});

app.get('/grapes',redirectLogin,function(req,res){
    res.render('grapes',{msg1:""});

});

app.get('/poetry',redirectLogin,function(req,res){
    res.render('poetry',{msg1:""});
  
});

app.get('/leaves',redirectLogin,function(req,res){
    res.render('leaves',{msg1:""});
 
});

app.get('/sun',redirectLogin,function(req,res){
    res.render('sun',{msg1:""});
  
});

app.get('/fiction',redirectLogin,function(req,res){
    res.render('fiction',{msg1:""});

});

app.get('/dune',redirectLogin,function(req,res){
    res.render('dune',{msg1:""});
});

app.get('/mockingbird',redirectLogin,function(req,res){
    res.render('mockingbird',{msg1:""});
});

app.post('/flies',function(req,res){
  var str = pushBook("Lord of the Flies",'flies',req.session.userId);
  res.render('flies',{msg1:str});
});



app.post('/grapes',function(req,res){
  var str = pushBook("The Grapes of Wrath",'grapes',req.session.userId);
  res.render('grapes',{msg1:str});
});


app.post('/leaves',function(req,res){
  var str = pushBook("Leaves of Grass",'leaves',req.session.userId);
  res.render('leaves',{msg1:str});
});


app.post('/sun',function(req,res){
  var addBookMessage = pushBook("The Sun and Her Flowers",'sun',req.session.userId);
  res.render('sun',{msg1:addBookMessage});
});


app.post('/dune',function(req,res){
  var addBookMessage = pushBook("Dune",'dune',req.session.userId);
  res.render('dune',{msg1:addBookMessage});
  
});


app.post('/mockingbird',function(req,res){
  var addBookMessage = pushBook("To Kill a Mockingbird",'mockingbird',req.session.userId);
  res.render('mockingbird',{msg1:addBookMessage});
});


//when user clicks search searchres page is rendered
//to get search results we take the str the user entered from req
//and pass it to getSearchResults
app.post('/search',function(req,res){
  
  str = req.body.Search;
  app.locals.result = getSearchResults(str.toLowerCase());
  //because .includes is case sensitive we make whatever the user entered lowercase to compare with other lowercase
  if((getSearchResults(str.toLowerCase())).length == 0){
  res.render('searchresults',{msg1:"not found"});}
  else{
    res.render('searchresults',{msg1:""});
  }
  
  
});


function pushBook(n,l,s){
  var arr = JSON.parse(fs.readFileSync("users.json")); //acessing json to retrieve user
  var x = {link:l,name:n};

  
     //found the user in arr[i]
      var found = false;  //flag to see if book exists in list
      var addBookMessage;
      for(var i = 0 ;i < getUser(s).books.length;i++){ //looping over user's booklist
        if(getUser(s).books[i].name == x.name){
        found = true; 
      } //end if
    } //end loop
    
      if(!found){ 
       for(var i = 0 ; i<arr.length;i++){
         if(getUser(s).name==arr[i].name){
            arr[i].books.push(x);//we push the book inside books for logged in user
            fs.writeFileSync("users.json",JSON.stringify(arr));
           addBookMessage = " book successfully added";
    }}}
     else{
       addBookMessage = " book is already in your want to read list"
     }
     return addBookMessage;
  
}//end method



function checkUnique(name){
  var data = JSON.parse(fs.readFileSync("users.json"));
  for(var i = 0; i<data.length; i++){
   if (name == data[i].name){
    return false; 
   }
  }
  return true;
 };


function getSearchResults(str){
  var searchResults = [] ;
  
if("to kill a mockingbird".includes(str)){
  x = {link:'mockingbird',name:"To kill a Mockingbird"}
  searchResults.push(x);
  
  }
if("the lord of the flies".includes(str)){
  x = {link:"flies",name:"The lord of the flies"}
  searchResults.push(x);
  
}
if("grapes of wrath".includes(str)){
  x = {link:"grapes",name:"Grapes of Wrath"}
  searchResults.push(x);

}
if("dune".includes(str)){
  x = {link:"dune",name:"Dune"}
  searchResults.push(x);
}
if("leaves of grass".includes(str)){
  x = {link:"leaves",name:"Leaves of grass"}
  searchResults.push(x);
}
if("the sun and her stars".includes(str)){
  x = {link:"sun",name:"The sun and her Flowers"}
  searchResults.push(x);
}
return searchResults;
}

function getUser(uname){
  var arr = JSON.parse(fs.readFileSync("users.json")); 
  for(var i = 0 ; i < arr.length;i++){
    if(arr[i].name == uname){
    return arr[i];
  }
}
}









