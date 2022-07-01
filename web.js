const express = require("express");
const mysql = require("mysql");
const crypto = require("crypto");
require("dotenv").config({path:"/home/hosting_users/ksiisk99v2/apps/ksiisk99v2_nctech/secret.env"});
const {SECRETKEY, HOST, USER, PASSWORD, DATABASE, PORT,STORAGE_PATH,VIEWS_PATH,ORIGIN_PATH,STATIC_PATH} = process.env;
const secretKey = SECRETKEY;
const fs=require("fs");
const multer=require("multer");
const path=require("path");
const upload=multer({
    storage:multer.diskStorage({
        destination:function(req,file,cb){
            cb(null,STORAGE_PATH);
                    
        },
        filename:function(req,file,cb){
            cb(null,new Date().valueOf()+path.extname(file.originalname));
        },
        limits: { fileSize: 1 * 1024 * 1024 }
    }),
});
const jwt = require("jsonwebtoken");
const db = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE
});
db.connect((err) => {
    if (err) { console.error(err); }
    else {
        console.log("MySQL Connected");
    }
});

const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { resolveNaptr } = require("dns");

app.set("views",VIEWS_PATH);
app.set("view engine", "ejs");

app.use(cors({
    origin: ORIGIN_PATH,
    credentials: true
}));
app.use(express.static(STATIC_PATH));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(8001, () => {
    const c_time=new Date().toLocaleString("ko-KR", {
        year: '2-digit',
        month: 'short',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
    });
    
    console.log("서버 가동 "+c_time);
});

//메인
app.get("/", (req, res) => {
    res.render("home");
});

//회사소개
app.get("/introduce", (req, res) => {
    res.render("introduce");
});
app.get("/introduce2", (req, res) => {
    res.render("introduce2");
});
app.get("/introduce3", (req, res) => {
    res.render("introduce3");
});

//제품소개 [키오스크]
app.get("/product", (req, res) => {
    if (req.cookies.token !== undefined) {
        jwt.verify(req.cookies.token, secretKey, (err, res2) => {
            if (err) {
                console.log("토큰 유효기간 만료");
                let sql = "select rftoken from mytb where actoken=?";
                db.query(sql, req.cookies.token, (err, res3) => {
                    if (err) { }
                    else {
                        jwt.verify(res3[0].rftoken, secretKey, (err, res4) => {
                            if (err) {
                                console.log("rftoken 기간만료");
                                res.clearCookie("token");
                                let tmp=(req.query.page-1)*2;

                                let sql="select img,title from producttb where id=0 LIMIT 18 OFFSET ?";
                                db.query(sql,tmp,(err,res6)=>{
                                    if(err){console.error(err);}
                                    else{
                                        sql="SELECT COUNT(*) AS total FROM producttb";
                                        db.query(sql,(err,res7)=>{
                                            if(err){console.error(err);}
                                            else{
                                                res6["total"]=res7[0].total;
                                                res6["pagenum"]=req.query.page;
                                                res.render("product",{plist:res6});
                                            }
                                        });
                                    }
                                });  
                            } else {
                                let AccessToken = jwt.sign({
                                    id: req.body.id,
                                    rand: Math.floor(Math.random() % 100) + 1
                                },
                                    secretKey,
                                    {
                                        expiresIn: '7d'
                                    });
                                let sql = "update mytb set actoken=? where actoken=?";
                                db.query(sql, [AccessToken, req.cookies.token], (err, res5) => {
                                    if (err) { }
                                    else {
                                        console.log("accesstoken 교체 완료");
                                        res.cookie("token", AccessToken);
                                        let tmp=(req.query.page-1)*2;

                                        let sql="select img,title from producttb where id=0 LIMIT 18 OFFSET ?";
                                        db.query(sql,tmp,(err,res6)=>{
                                            if(err){console.error(err);}
                                            else{
                                                sql="SELECT COUNT(*) AS total FROM producttb";
                                                db.query(sql,(err,res7)=>{
                                                    if(err){console.error(err);}
                                                    else{
                                                        res6["total"]=res7[0].total;
                                                        res6["pagenum"]=req.query.page;
                                                        res.render("kyh_product",{plist:res6});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                })
                            }
                        });
                    }
                });
            } else {
                let tmp=(req.query.page-1)*2;

                let sql="select img,title from producttb where id=0 LIMIT 18 OFFSET ?";
                db.query(sql,tmp,(err,res6)=>{
                    if(err){console.error(err);}
                    else{
                        sql="SELECT COUNT(*) AS total FROM producttb";
                        db.query(sql,(err,res7)=>{
                            if(err){console.error(err);}
                            else{
                                res6["total"]=res7[0].total;
                                res6["pagenum"]=req.query.page;
                                res.render("kyh_product",{plist:res6});
                            }
                        });
                    }
                });
            }
        });
    }else{
        let tmp=(req.query.page-1)*2;

        let sql="select img,title from producttb where id=0 LIMIT 18 OFFSET ?";
        db.query(sql,tmp,(err,res2)=>{
            if(err){console.error(err);}
            else{
                sql="SELECT COUNT(*) AS total FROM producttb";
                db.query(sql,(err,res3)=>{
                    if(err){console.error(err);}
                    else{
                        res2["total"]=res3[0].total;
                        res2["pagenum"]=req.query.page;
                        res.render("product",{plist:res2});
                    }
                });
            }
        });
    }
    

});
//[키오스크] 글 페이지
app.get("/write_product",(req,res)=>{
    if (req.cookies.token !== undefined) {
        jwt.verify(req.cookies.token, secretKey, (err, res2) => {
            if (err) {
                console.log("토큰 유효기간 만료");
                let sql = "select rftoken from mytb where actoken=?";
                db.query(sql, req.cookies.token, (err, res3) => {
                    if (err) { }
                    else {
                        jwt.verify(res3[0].rftoken, secretKey, (err, res4) => {
                            if (err) {
                                console.log("rftoken 기간만료");
                                res.clearCookie("token");
                                res.render("product");
                            } else {
                                let AccessToken = jwt.sign({
                                    id: req.body.id,
                                    rand: Math.floor(Math.random() % 100) + 1
                                },
                                    secretKey,
                                    {
                                        expiresIn: '7d'
                                    });
                                let sql = "update mytb set actoken=? where actoken=?";
                                db.query(sql, [AccessToken, req.cookies.token], (err, res5) => {
                                    if (err) { }
                                    else {
                                        console.log("accesstoken 교체 완료");
                                        res.cookie("token", AccessToken);
                                        res.render("write_product");
                                    }
                                })
                            }
                        });
                    }
                });
            } else {
                res.render("write_product");
            }
        });
    }else{
        res.render("product");
    }
    
});
//[키오스크] 글 작성
app.post("/write_product",upload.single("img"),(req,res)=>{
    let sql="insert into producttb(id,img,title) values(0,?,?)";
    db.query(sql,[req.file.filename,req.body.title],(err,res2)=>{
        if(err){
            fs.unlink(`/home/hosting_users/ksiisk99v2/apps/ksiisk99v2_nctech/public/uploads/${req.file.filename}`,(err)=>{
                console.log("이미지 삭제");
            });
            res.send("<script>alert('형식을 벗어났습니다.');location.href=document.referrer;</script>");
            console.error(err);
        }
        else{
            sql="select img,title from producttb where id=0 LIMIT 18 OFFSET 0";
            db.query(sql,(err,res6)=>{
                if(err){console.error(err);}
                else{
                    sql="SELECT COUNT(*) AS total FROM producttb";
                    db.query(sql,(err,res7)=>{
                        if(err){console.error(err);}
                        else{
                            res6["total"]=res7[0].total;
                            res6["pagenum"]=1;
                            res.render("kyh_product",{plist:res6});
                        }
                    });
                }
            });  
        }
    });
});
//[키오스크] 글 삭제
app.post("/delete_product",(req,res)=>{
    let sql="delete from producttb where id=0 and img=?";
    db.query(sql,req.body.img,(err,res2)=>{
        if(err){console.error(err);}
        else{
            fs.unlink(`/home/hosting_users/ksiisk99v2/apps/ksiisk99v2_nctech/public/uploads/${req.body.img}`,(err)=>{
                if(err){console.error(err);}
                else{
                    sql="select img,title from producttb where id=0 LIMIT 18 OFFSET 0";
                    db.query(sql,(err,res6)=>{
                        if(err){console.error(err);}
                        else{
                            sql="SELECT COUNT(*) AS total FROM producttb";
                            db.query(sql,(err,res7)=>{
                                if(err){console.error(err);}
                                else{
                                    res6["total"]=res7[0].total;
                                    res6["pagenum"]=1;
                                    res.render("kyh_product",{plist:res6});
                                }
                            });
                        }
                    }); 

                }
            });
        }
    })
});
//제품 검색
app.post("/search_product",(req,res)=>{
    if (req.cookies.token !== undefined) {
        jwt.verify(req.cookies.token, secretKey, (err, res2) => {
            if (err) {
                console.log("토큰 유효기간 만료");
                let sql = "select rftoken from mytb where actoken=?";
                db.query(sql, req.cookies.token, (err, res3) => {
                    if (err) { }
                    else {
                        jwt.verify(res3[0].rftoken, secretKey, (err, res4) => {
                            if (err) {
                                console.log("rftoken 기간만료");
                                res.clearCookie("token");
                                //로그인 페이지로 간다.
                                let sql="select img,title from producttb where id=? and title like ?";
                                let tmp='%'+req.body.title+'%';
                                db.query(sql,[req.body.id,tmp],(err,res7)=>{
                                    if(err){console.error(err);}
                                    else{
                                        res.render("search_product",{plist:res7});
                                    }
                                })
                            } else {
                                let AccessToken = jwt.sign({
                                    id: req.body.id,
                                    rand: Math.floor(Math.random() % 100) + 1
                                },
                                    secretKey,
                                    {
                                        expiresIn: '7d'
                                    });
                                let sql = "update mytb set actoken=? where actoken=?";
                                db.query(sql, [AccessToken, req.cookies.token], (err, res5) => {
                                    if (err) { }
                                    else {
                                        console.log("accesstoken 교체 완료");
                                        res.cookie("token", AccessToken);
                                        let sql="select img,title from producttb where id=? and title like ?";
                                        let tmp='%'+req.body.title+'%';
                                        db.query(sql,[req.body.id,tmp],(err,res7)=>{
                                            if(err){console.error(err);}
                                            else{
                                                res.render("kyh_search_product",{plist:res7});
                                            }
                                        })
                                    }
                                })
                            }
                        });
                    }
                });
            } else {
                let sql="select img,title from producttb where id=? and title like ?";
                let tmp='%'+req.body.title+'%';
                db.query(sql,[req.body.id,tmp],(err,res7)=>{
                    if(err){console.error(err);}
                    else{
                        res.render("kyh_search_product",{plist:res7});
                    }
                })
            }
        });
    }else{
        let sql="select img,title from producttb where id=? and title like ?";
        let tmp='%'+req.body.title+'%';
        db.query(sql,[req.body.id,tmp],(err,res7)=>{
            if(err){console.error(err);}
            else{
                res.render("search_product",{plist:res7});
            }
        })
    }
    
});

//견적문의
app.get("/estimate",(req,res)=>{
    let tmp=(req.query.page-1)*10;

    let sql="select * from estimatetb ORDER BY id DESC LIMIT 10 OFFSET ?";
    db.query(sql,tmp,(err,res2)=>{
        if(err){console.error(err);}
        else{
            sql="SELECT COUNT(*) AS total FROM estimatetb";
            db.query(sql,(err,res3)=>{
                if(err){console.error(err);}
                else{
                    res2["total"]=res3[0].total;
                    res2["pagenum"]=req.query.page;
                    res.render("estimate",{elist:res2});
                }
            })
            
        }
    });
});
//견적검색
app.post("/search_estimate",(req,res)=>{
    let sql="select * from estimatetb where title like ? ORDER BY id DESC";
    db.query(sql,'%'+req.body.title+'%',(err,res2)=>{
        if(err){console.error(err);}
        else{
            res.render("search_estimate",{elist:res2});
        }
    })
})
//견적 페이지 클릭
app.get("/estimate/:id", (req, res) => {
    if(req.params.id>=0){
        let sql="select * from estimatetb where id=?";
        db.query(sql,req.params.id,(err,res2)=>{
            if(err){console.error(err);}
            else{
                if (req.cookies.token !== undefined) {
                    jwt.verify(req.cookies.token, secretKey, (err, res4) => {
                        if (err) {
                            console.log("토큰 유효기간 만료");
                            let sql = "select rftoken from mytb where actoken=?";
                            db.query(sql, req.cookies.token, (err, res5) => {
                                if (err) { }
                                else {
                                    jwt.verify(res5[0].rftoken, secretKey, (err, res6) => {
                                        if (err) {
                                            console.log("rftoken 기간만료");
                                            res.clearCookie("token");
                                            if(res2[0].public===0){
                                                if(res2[0].imgs!==null){
                                                    res2[0].imgs=res2[0].imgs.split(",");
                                                }
                                                res.render("read_estimate",{elist:res2[0],success:true});
                                            }else if(res2[0].public===1){
                                                sql="update estimatetb set views=views+1 where id=?";
                                                db.query(sql,req.params.id,(err,res3)=>{
                                                    if(err){console.error(err);}
                                                    else{}
                                                })
                                                if(res2[0].imgs!==null){
                                                    res2[0].imgs=res2[0].imgs.split(",");
                                                }
                                                if(res2[0].checkcomment===1){
                                                    sql="select date,content from commenttb where estimateid=?";
                                                    db.query(sql,req.params.id,(err,res3)=>{
                                                        if(err){console.error(err);}
                                                        else{
                                                            res2[0]["checkcomment"]=1;
                                                            res2[0]["comment"]=new Array();
                                                            for(let i=0;i<res3.length;i++){
                                                                tmp={
                                                                    date:res3[i].date,
                                                                    content:res3[i].content
                                                                };
                                                                res2[0]["comment"].push(tmp);  
                                                            }
                                                            res.render("read_estimate2",{elist:res2[0]});
                                                        }
                                                    });
                                                }else{
                                                    res2[0]["checkcomment"]=0;
                                                    res2[0]["comment"]=new Array();
                                                    res.render("read_estimate2",{elist:res2[0]});
                                                }
                                            }
                                        } else {
                                            let AccessToken = jwt.sign({
                                                id: req.body.id,
                                                rand: Math.floor(Math.random() % 100) + 1
                                            },
                                                secretKey,
                                                {
                                                    expiresIn: '7d'
                                                });
                                            let sql = "update mytb set actoken=? where actoken=?";
                                            db.query(sql, [AccessToken, req.cookies.token], (err, res7) => {
                                                if (err) { }
                                                else {
                                                    console.log("accesstoken 교체 완료");
                                                    res.cookie("token", AccessToken);
                                                    sql="update estimatetb set views=views+1 where id=?";
                                                    db.query(sql,req.params.id,(err,res3)=>{
                                                        if(err){console.error(err);}
                                                        else{}
                                                    })
                                                    if(res2[0].imgs!==null){
                                                        res2[0].imgs=res2[0].imgs.split(",");
                                                    }
                                                    if(res2[0].checkcomment===1){
                                                        sql="select date,content from commenttb where estimateid=?";
                                                        db.query(sql,req.params.id,(err,res3)=>{
                                                            if(err){console.error(err);}
                                                            else{
                                                                res2[0]["checkcomment"]=1;
                                                                res2[0]["comment"]=new Array();
                                                                for(let i=0;i<res3.length;i++){
                                                                    tmp={
                                                                        date:res3[i].date,
                                                                        content:res3[i].content
                                                                    };
                                                                    res2[0]["comment"].push(tmp);                                     
                                                                }
                                                                res.render("kyh_read_estimate",{elist:res2[0]});
                                                            }
                                                        });
                                                    }else{
                                                        res2[0]["checkcomment"]=0;
                                                        res2[0]["comment"]=new Array();
                                                        res.render("kyh_read_estimate",{elist:res2[0]});
                                                    }
                                                }
                                            })
                                        }
                                    });
                                }
                            });
                        } else {//로그인 유저일 경우
                            sql="update estimatetb set views=views+1 where id=?";
                            db.query(sql,req.params.id,(err,res3)=>{
                                if(err){console.error(err);}
                                else{}
                            })
                            if(res2[0].imgs!==null){
                                res2[0].imgs=res2[0].imgs.split(",");
                            }
                            if(res2[0].checkcomment===1){
                                sql="select date,content from commenttb where estimateid=?";
                                db.query(sql,req.params.id,(err,res3)=>{
                                    if(err){console.error(err);}
                                    else{
                                        res2[0]["checkcomment"]=1;
                                        res2[0]["comment"]=new Array();
                                        for(let i=0;i<res3.length;i++){
                                            tmp={
                                                date:res3[i].date,
                                                content:res3[i].content
                                            };
                                            res2[0]["comment"].push(tmp);                                     
                                        }
                                        res.render("kyh_read_estimate",{elist:res2[0]});
                                    }
                                });
                            }else{
                                res2[0]["checkcomment"]=0;
                                res2[0]["comment"]=new Array();
                                res.render("kyh_read_estimate",{elist:res2[0]});
                            }
                        }
                    });
                }else{
                    if(res2[0].public===0){
                        if(res2[0].imgs!==null){
                            res2[0].imgs=res2[0].imgs.split(",");
                        }
                        res.render("read_estimate",{elist:res2[0],success:true});
                    }else if(res2[0].public===1){
                        sql="update estimatetb set views=views+1 where id=?";
                        db.query(sql,req.params.id,(err,res3)=>{
                            if(err){console.error(err);}
                            else{}
                        })
                        if(res2[0].imgs!==null){
                            res2[0].imgs=res2[0].imgs.split(",");
                        }
                        if(res2[0].checkcomment===1){
                            sql="select date,content from commenttb where estimateid=?";
                            db.query(sql,req.params.id,(err,res3)=>{
                                if(err){console.error(err);}
                                else{
                                    res2[0]["checkcomment"]=1;
                                    res2[0]["comment"]=new Array();
                                    for(let i=0;i<res3.length;i++){
                                        tmp={
                                            date:res3[i].date,
                                            content:res3[i].content
                                        };
                                        res2[0]["comment"].push(tmp);
                                       
                                    }
                                    
                                    res.render("read_estimate2",{elist:res2[0]});
                                }
                            });
                        }else{
                            res2[0]["checkcomment"]=0;
                            res2[0]["comment"]=new Array();
                            res.render("read_estimate2",{elist:res2[0]});
                        }
                    }
                }
            }
        });
    }
});
//암호 걸린 페이지 비밀번호 입력 시
app.post("/estimate/:id",(req,res)=>{
    let sql="select * from estimatetb where id=?";
    db.query(sql,req.body.id,(err,res2)=>{
        if(err){console.error(err);}
        else{
            if(res2[0].password===req.body.password){   
                sql="update estimatetb set views=views+1 where id=?";
                db.query(sql,req.params.id,(err,res3)=>{
                    if(err){console.error(err);}
                    else{}
                })
                if(res2[0].imgs!==null){
                    res2[0].imgs=res2[0].imgs.split(",");
                }
                if(res2[0].checkcomment===1){
                    sql="select date,content from commenttb where estimateid=?";
                    db.query(sql,req.params.id,(err,res3)=>{
                        if(err){console.error(err);}
                        else{
                            res2[0]["checkcomment"]=1;
                            res2[0]["comment"]=new Array();
                            for(let i=0;i<res3.length;i++){
                                tmp={
                                    date:res3[i].date,
                                    content:res3[i].content
                                };
                                res2[0]["comment"].push(tmp);
                               
                            }
                            res.render("read_estimate2",{elist:res2[0]});
                            //res.render("kyh_read_estimate",{elist:res2[0]});
                        }
                    });
                }else{
                    res2[0]["checkcomment"]=0;
                    res2[0]["comment"]=new Array();
                    res.render("read_estimate2",{elist:res2[0]});
                    //res.render("kyh_read_estimate",{elist:res2[0]});
                }
            }else{ //비밀번호 틀림
                res.send("<script>alert('비밀번호가 틀렸습니다.');location.href=document.referrer;</script>");
            }
        }
    });
});
//견적 작성 페이지
app.get("/write_estimate",(req,res)=>{
    res.render("write_estimate");
});
//견적 페이지 작성하기
app.post("/write_estimate",upload.array("img"),(req,res)=>{
    console.log("write_Estimate");
    let imgs=null;
    let sql;
    let tmp_imgs=[];
    if(req.files.length>0){
        for(var i=0;i<req.files.length;i++){
            tmp_imgs[i]=req.files[i].filename;
        }
        imgs=tmp_imgs.join();
    }
    let param;
    const c_time=new Date().toLocaleString("ko-KR", {
        year: '2-digit',
        month: 'short',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
    });
    if(req.body.public === 0){
        sql="INSERT INTO estimatetb(title,writer,date,views,public,content,imgs) VALUES(?,?,?,?,?,?,?)";
        param=[req.body.title,req.body.writer,c_time,1,req.body.public,req.body.content,imgs];
        //이미지 바꾸자
    }else{
        sql="INSERT INTO estimatetb(title,writer,date,views,public,password,content,imgs) VALUES(?,?,?,?,?,?,?,?)";
        param=[req.body.title,req.body.writer,c_time,1,req.body.public,req.body.password,req.body.content,imgs];
        //이미지 데이터 형식 바꾸자
    }
    
    db.query(sql,param,(err,res2)=>{
        if(err){
            for(var i=0;i<req.files.length;i++){
                fs.unlink(`/home/hosting_users/ksiisk99v2/apps/ksiisk99v2_nctech/public/uploads/${req.files[i].filename}`,(err)=>{
                    if(err){console.error(err);}
                    else{}
                })
            }
            res.send("<script>alert('형식을 벗어났습니다.');location.href=document.referrer;</script>");
            console.error(err);
        }
        else{
            const elist2={
                id:res2.insertId,
                title:req.body.title,
                writer:req.body.writer,
                date:req.body.date,
                content:req.body.content,
                imgs:tmp_imgs,
                checkcomment:0,
                comment:new Array()
            }
            res.render("read_estimate2",{elist:elist2}); 
        }
    });
});
//견적 페이지 삭제 요청
app.post("/delete_estimate",(req,res)=>{
    let sql="DELETE FROM estimatetb where id=?";
    let sql2="DELETE FROM commenttb where estimateid=?";
    db.query(sql2,req.body.id,(err,res2)=>{
        if(err){console.error(err);}
        else{
            
        }
    })

    if(req.body.imgs.length>0){
        let imgs=req.body.imgs;
        imgs=imgs.split(",");
        for(var i=0;i<imgs.length;i++){
            fs.unlink(`/home/hosting_users/ksiisk99v2/apps/ksiisk99v2_nctech/public/uploads/${imgs[i]}`,(err)=>{
                if(err){console.error(err);}
                else{}
            })
        }
        db.query(sql,req.body.id,(err,res2)=>{
            if(err){console.error(err);}
            else{
                sql="update estimatetb set id=id-1 where id>?"
                db.query(sql,req.body.id,(err,res3)=>{
                    if(err){console.error(err);}
                    else{
                        sql="select * from estimatetb ORDER BY id DESC";
                        db.query(sql,(err,res5)=>{
                            if(err){console.error(err);}
                            else{
                                sql="alter table estimatetb AUTO_INCREMENT=?";
                                db.query(sql,res5.length+1,(err,res4)=>{
                                    if(err){console.error(err);}
                                    else{
                                        res.render("estimate",{elist:res5});
                                    }
                                })
                            
                            }
                        });
                    }
                })
            }
        });
    }else{
        db.query(sql,req.body.id,(err,res2)=>{
            if(err){console.error(err);}
            else{
                sql="update estimatetb set id=id-1 where id>?"
                db.query(sql,req.body.id,(err,res3)=>{
                    if(err){console.error(err);}
                    else{
                        sql="select * from estimatetb ORDER BY id DESC";
                        db.query(sql,(err,res5)=>{
                            if(err){console.error(err);}
                            else{
                                sql="alter table estimatetb AUTO_INCREMENT=?";
                                db.query(sql,res5.length+1,(err,res4)=>{
                                    if(err){console.error(err);}
                                    else{
                                        res.render("estimate",{elist:res5});
                                    }
                                })
                            
                            }
                        });
                    }
                })
            }
        });
    }
})
//댓글작성
app.post("/write_comment",(req,res)=>{
    const c_time=new Date().toLocaleString("ko-KR", {
        year: '2-digit',
        month: 'short',
        day: '2-digit',
        timeZone: 'Asia/Seoul'
    });
    let sql="insert into commenttb(estimateid,num,date,content) values(?,?,?,?)";
    param=[req.body.id,req.body.num,c_time,req.body.content];
    db.query(sql,param,(err,res2)=>{
        if(err){console.error(err);}
        else{
            sql="update estimatetb set checkcomment=1 where id=?";
            db.query(sql,req.body.id,(err,res3)=>{
                if(err){console.error(err);}
                else{
                    sql="select * from estimatetb where id=?";
                    db.query(sql,req.body.id,(err,res4)=>{
                        if(err){console.error(err);}
                        else{     
                            if(res4[0].imgs!==null){
                                res4[0].imgs=res4[0].imgs.split(",");
                            }
                            sql="select date,content from commenttb where estimateid=?";
                            db.query(sql,req.body.id,(err,res5)=>{
                                if(err){console.error(err);}
                                else{
                                   
                                    res4[0]["checkcomment"]=1;
                                    res4[0]["comment"]=new Array();
                                    for(let i=0;i<res5.length;i++){
                                        tmp={
                                            date:res5[i].date,
                                            content:res5[i].content
                                        };
                                        res4[0]["comment"].push(tmp);
                                    }
                                    res.render("kyh_read_estimate",{elist:res4[0]});
                                }
                            });
                            
                        }
                    });
                }
            })
        }
    });
});
//댓글 삭제
app.post("/delete_comment",(req,res)=>{
    let sql="DELETE FROM commenttb where estimateid=? and num=?";
    db.query(sql,[req.body.id,req.body.commentid],(err,res2)=>{
        if(err){console.error(err);}
        else{
            sql="update commenttb set num=num-1 where num>?";
            db.query(sql,req.body.commentid,(err,res3)=>{
                if(err){console.error(err);}
                else{
               
                    if(req.body.commentid==='0' && res3.affectedRows === 0){
                    
                        sql="update estimatetb set checkcomment=0 where id=?";
                        db.query(sql,req.body.id,(err,res4)=>{
                            if(err){console.error(err);}
                            else{
                                sql="select * from estimatetb where id=?";
                                db.query(sql,req.body.id,(err,res5)=>{
                                    if(err){console.error(err);}
                                    else{     
                                        if(res5[0].imgs!==null){
                                            res5[0].imgs=res5[0].imgs.split(",");
                                        }
                                        sql="select date,content from commenttb where estimateid=?";
                                        db.query(sql,req.body.id,(err,res6)=>{
                                            if(err){console.error(err);}
                                            else{
                                               
                                                res5[0]["checkcomment"]=1;
                                                res5[0]["comment"]=new Array();
                                                for(let i=0;i<res6.length;i++){
                                                    tmp={
                                                        date:res6[i].date,
                                                        content:res6[i].content
                                                    };
                                                    res5[0]["comment"].push(tmp);
                                                }
                                                res.render("kyh_read_estimate",{elist:res5[0]});
                                            }
                                        });
                                        
                                    }
                                });
                            }
                        })
                    }else{
                        sql="select * from estimatetb where id=?";
                        db.query(sql,req.body.id,(err,res4)=>{
                            if(err){console.error(err);}
                            else{     
                                if(res4[0].imgs!==null){
                                    res4[0].imgs=res4[0].imgs.split(",");
                                }
                                sql="select date,content from commenttb where estimateid=?";
                                db.query(sql,req.body.id,(err,res5)=>{
                                    if(err){console.error(err);}
                                    else{
                                       
                                        res4[0]["checkcomment"]=1;
                                        res4[0]["comment"]=new Array();
                                        for(let i=0;i<res5.length;i++){
                                            tmp={
                                                date:res5[i].date,
                                                content:res5[i].content
                                            };
                                            res4[0]["comment"].push(tmp);
                                        }
                                        res.render("kyh_read_estimate",{elist:res4[0]});
                                    }
                                });
                                
                            }
                        });
                    }
                }
            })
            
        }
    });
})

//로그인
app.get("/login", (req, res) => {
    if(req.cookies.token===undefined){
        res.render("login");
    }else{
        res.render("logout");
    }
    
})
//로그인 요청
app.post("/req_login", (req, res) => {
    //아이디로 접근하여 비번과 salt를 가져와 대입해본다.
    let sql = "select password,salt from mytb where name=?";

    db.query(sql, req.body.id, (err, res2) => {
     
        if (err) { }
        else if (res2.length > 0) {
            const p = crypto.createHash('sha256').update(req.body.pass + res2[0].salt).digest('hex');
           
            if (p === res2[0].password) { //로그인성공
                let AccessToken = jwt.sign({
                    id: req.body.id,
                    rand: Math.floor(Math.random() % 100) + 1
                },
                    secretKey,
                    {
                        expiresIn: '7d'
                    });
                let RefreshToken = jwt.sign({
                    id: req.body.id,
                    rand: Math.floor(Math.random() % 100) + 100
                },
                    secretKey,
                    {
                        expiresIn: '28d'
                    });
                let sql = "update mytb set rftoken=?, actoken=? where name=?";
                db.query(sql, [RefreshToken, AccessToken, req.body.id], (err, res3) => {
                    if (err) { }
                    else {
                        console.log("로그인 성공");
                        res.cookie("token", AccessToken);
                        res.render("home");
                    }
                });
            } else { //로그인 실패시
                console.log("로그인 정보가 일치 하지 않습니다.");
                res.send("<script>alert('비밀번호가 틀렸습니다.');location.href=document.referrer;</script>");
            }
        } else {
            console.log("로그인 정보가 일치하지 않습니다.")
            res.send("<script>alert('비밀번호가 틀렸습니다.');location.href=document.referrer;</script>");
        }
    });
});

app.post("/req_logout",(req,res)=>{
    res.clearCookie("token");
    res.render("home");
})
