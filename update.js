!function(){"use strict";function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var t=e(require("node-fetch")),a=e(require("ipfs-http-client")),r=e(require("ipfs-unixfs-importer")),s=require("stream"),o=e(require("p-queue")),i=require("@octokit/rest"),n=require("@octokit/plugin-retry");require("crypto");const c=e=>!!e.success;let l,h=0;const d=async e=>l&&h<=200?(h++,l):(h=0,l=await(async e=>Object.entries(await e).map(([e,t])=>`${e}=${t}`).join("; "))((async e=>{const a=(await t("https://lihkg.com/",{headers:{Host:"lihkg.com",Referer:"https://lihkg.com/","User-Agent":e,Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US","Accept-Encoding":"gzip, deflate, br"}})).headers.raw()["set-cookie"];return Object.fromEntries(a.map(e=>{const t=e.match(/^(\w+)=(.+?);/);return[t[1],t[2]]}))})(e)),l),p="Mozilla/5.0 Gecko/20100101 Firefox/71.0",u=2e4;class m{static async fetchAPIResponse(e){const a=await d(p),r=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":p,Cookie:a}});if(!r.ok)throw console.error(await r.text()),new Error(`${e} ${r.status} ${r.statusText}`);const s=await r.json();if(!c(s))throw new Error(`${e} ${s.error_code} ${s.error_message}`);return s}static async fetchThreadDetail(e,t=1,a="reply_time"){const r=`${this.ENDPOINT}/thread/${e}/page/${t}?order=${a}`;return(await this.fetchAPIResponse(r)).response}static async fetchFullThread(e){const t=await this.fetchThreadDetail(e,1),{total_page:a,item_data:r}=t;return r.push(...(await Promise.all(Array.from({length:a-2}).map(async(t,a)=>{return(await this.fetchThreadDetail(e,a+2)).item_data}))).flat()),t.page=void 0,t}static async fetchUser(e){const t=`${this.ENDPOINT}/user/${e}/profile`;return(await this.fetchAPIResponse(t)).response.user}static async fetchLatestThreads(e=1,t=1){const a=`${this.ENDPOINT}/thread/latest?cat_id=${t}&page=${e}&count=60&type=now`;return(await this.fetchAPIResponse(a)).response}}m.ENDPOINT="https://lihkg.com/api_v2";const f=m.fetchFullThread.bind(m);m.fetchUser.bind(m);class w{static formatTime(e){return new Date(1e3*e)}static formatReply(e){return{pid:e.post_id,tid:+e.thread_id,uid:+e.user.user_id,like:+e.like_count,dislike:+e.dislike_count,score:+e.vote_score,quote:e.quote&&this.formatReply(e.quote),citedBy:+e.no_of_quote,replyTime:this.formatTime(e.reply_time),msg:e.msg}}static formatThread(e){return{tid:+e.thread_id,cid:+e.cat_id,subCid:+e.sub_cat_id,title:e.title,createTime:this.formatTime(e.create_time),updateTime:this.formatTime(e.last_reply_time),uid:+e.user_id,like:+e.like_count,dislike:+e.dislike_count,uniUserReply:+e.no_of_uni_user_reply,remark:e.remark&&e.remark.notice}}static formatThreadDetail(e){return{...this.formatThread(e),replies:e.item_data.map(e=>this.formatReply(e)),pinned:e.pinned_post&&this.formatReply(e.pinned_post)}}static formatThreadInfo(e){return{...this.formatThread(e),lastReplyTime:this.formatTime(e.last_reply_time),lastReplyUid:+e.last_reply_user_id}}static formatThreadMinInfo(e){return{tid:+e.thread_id,cid:+e.cat_id,uid:+e.user_id,title:e.title,score:+e.like_count-+e.dislike_count,replied:e.last_reply_time,pages:+e.total_page}}static formatUserInfo(e){return{uid:+e.user_id,name:e.nickname,gender:e.gender,level:+e.level,levelName:e.level_name,createTime:this.formatTime(e.create_time)}}}const g={put(){}},_=a("https://ipfs.infura.io:5001/"),y=async e=>{const t=[{content:e}];let a;for await(const e of r(t,g,{onlyHash:!0}))a=e.cid;return a},T=async e=>{try{let t;for await(const a of _.add(e,{pin:!0}))t=a.cid;return t}catch(e){console.error(e.name,":",e.message)}},$=new o({concurrency:10}),k=/https?:\/\/(?:www\.)?na\.cx\/i\/(\w+\.\w+)/g;async function b(e,a=!1){const r=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":p},timeout:u});if(!r.ok)throw new Error(`${e} ${r.status} ${r.statusText}`);if(a)return r.body;return await r.buffer()}const O=e=>Promise.all(e.replies.map(e=>{const t=[...e.msg.matchAll(k)];return Promise.all(t.map(async t=>{const[a,r]=t;try{const t=await(async(e,t=!1)=>{let a,r;if(t){const t=await b(e,!0),o=t.pipe(new s.PassThrough),i=t.pipe(new s.PassThrough);a=$.add(()=>T(o)),r=await y(i)}else{const t=await b(e);a=$.add(()=>T(t)),r=await y(t)}return a.then(t=>{t&&r&&t.equals(r)?console.log(`uploaded ${e} : ${r}`):console.error(`upload ${e} error: cid mismatches`)}),r.toString()})(a);e.msg=e.msg.replace(new RegExp(a,"g"),`https://ipfs.infura.io/ipfs/${t}?filename=${r}`)}catch(e){console.error(e)}}))})),R=process.env.AUTH_TOKEN;if(!R)throw new Error("AUTH_TOKEN is undefined");const q=new(i.Octokit.plugin(n.retry))({auth:R}),E="lihkg-backup",j="threads",A="master",I={email:"lihkg@github.com",name:"lihkg"},v=e=>{return+e.toString().slice(-1)[0]},D=e=>`${(new Date).toISOString()} update\n${e.join(",")}`;class N{constructor(){this.threads={}}add(e,t){const a=v(e);this.threads[a]||(this.threads[a]={}),this.threads[a][e]=t}async commit(e=A){const t=await q.git.getTree({owner:E,repo:j,tree_sha:e}),a=t.data.tree.filter(e=>"blob"!==e.type),r=t.data.sha,s={};for(const[e,t]of Object.entries(this.threads)){console.log("subtree",e);const r=a[+e];if(r.path!=e)throw new Error(`tree invalid: ${JSON.stringify(r)}`);const o=r.sha,i=Object.entries(t).map(([e,t])=>({path:`${e}.json`,content:t,mode:"100644"})),n=(await q.git.createTree({owner:E,repo:j,tree:i,base_tree:o})).data.sha;console.log("updated subtree",e,n);const c=(await q.git.createCommit({owner:E,repo:j,tree:n,message:D(Object.entries(t).map(([e])=>+e)),parents:[o],author:I})).data.sha;await q.git.updateRef({owner:E,repo:j,ref:`heads/${e}`,sha:c,force:!0}),console.log("updated branch",e,c),s[e]=c}console.log("updating the root tree");const o=Object.entries(s).map(([e,t])=>({path:e,mode:"160000",type:"commit",sha:t})),i=(await q.git.createTree({owner:E,repo:j,tree:o,base_tree:r})).data.sha;return console.log("updated root tree",i),i}}const P=async e=>{const t=await f(e),a=w.formatThreadDetail(t);return await O(a),JSON.stringify(a)};(async e=>{const t=await(async(e=15)=>{const t=new Set,a=t=>+new Date-+t>6e4*e;for(let e=1;;e++)try{const{items:r}=await m.fetchLatestThreads(e),s=r.map(e=>[+e.thread_id,w.formatTime(e.last_reply_time)]);if(s.forEach(([e,r])=>{a(r)||t.add(e)}),s.some(([,e])=>a(e)))break}catch(e){console.error(e);break}return[...t].reverse()})(),a=t.length;console.log(a,t);const r=new o({concurrency:e});let s=0;const i=new N;for(let e=0;e<a;e++){const o=t[e];r.add(async()=>{console.log(`update ${o}.json ${e+1}/${a}`);try{const e=await P(o);i.add(o,e),s++,console.log(`success ${o}.json ${s}/${a}`)}catch(e){console.error(e.name+" "+e.message)}})}await r.onIdle();const n=await i.commit(),c=await(async(e,t,a=A)=>{const r=`heads/${a}`,s=(await q.git.getRef({owner:E,repo:j,ref:r})).data.object.sha;console.log("old commit",s);const o=await q.git.createCommit({owner:E,repo:j,tree:e,message:t,parents:[s],author:I}),i=o.data.sha;return o.data.tree=void 0,console.log("new commit",o.data),await q.git.updateRef({owner:E,repo:j,ref:r,sha:i}),i})(n,D(t));await(async e=>{const{data:{sha:t}}=await q.repos.getContent({owner:E,repo:"updater",path:"latest"});await q.repos.createOrUpdateFileContents({owner:E,repo:"updater",path:"latest",sha:t,content:`https://github.com/github/archive-program/tree/${e}`,message:`${(new Date).toISOString()}`,author:I})})(c),console.log(`${s}/${a} success`)})(50)}();
