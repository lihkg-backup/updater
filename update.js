!function(){"use strict";function e(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var t=e(require("node-fetch")),r=e(require("ipfs-http-client")),a=e(require("ipfs-unixfs-importer")),s=require("stream"),o=e(require("p-queue")),i=require("@octokit/rest"),n=require("@octokit/plugin-retry");require("crypto");const c=e=>!!e.success;let l,h=0;const d=async e=>l&&h<=200?(h++,l):(h=0,l=await(async e=>Object.entries(await e).map(([e,t])=>`${e}=${t}`).join("; "))((async e=>{const r=(await t("https://lihkg.com/",{headers:{Host:"lihkg.com",Referer:"https://lihkg.com/","User-Agent":e,Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language":"en-US","Accept-Encoding":"gzip, deflate, br"}})).headers.raw()["set-cookie"];return Object.fromEntries(r.map(e=>{const t=e.match(/^(\w+)=(.+?);/);return[t[1],t[2]]}))})(e)),l),m="Mozilla/5.0 Gecko/20100101 Firefox/71.0",p=2e4;class u{static async fetchAPIResponse(e){const r=await d(m),a=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":m,Cookie:r}});if(!a.ok)throw console.error(await a.text()),new Error(`${e} ${a.status} ${a.statusText}`);const s=await a.json();if(!c(s))throw new Error(`${e} ${s.error_code} ${s.error_message}`);return s}static async fetchThreadDetail(e,t=1,r="reply_time"){const a=`${this.ENDPOINT}/thread/${e}/page/${t}?order=${r}`;return(await this.fetchAPIResponse(a)).response}static async fetchFullThread(e){const t=await this.fetchThreadDetail(e,1),{total_page:r,item_data:a}=t;return a.push(...(await Promise.all(Array.from({length:r-2}).map(async(t,r)=>{return(await this.fetchThreadDetail(e,r+2)).item_data}))).flat()),t.page=void 0,t}static async fetchUser(e){const t=`${this.ENDPOINT}/user/${e}/profile`;return(await this.fetchAPIResponse(t)).response.user}static async fetchLatestThreads(e=1,t=1){const r=`${this.ENDPOINT}/thread/latest?cat_id=${t}&page=${e}&count=60&type=now`;return(await this.fetchAPIResponse(r)).response}}u.ENDPOINT="https://lihkg.com/api_v2";const f=u.fetchFullThread.bind(u);u.fetchUser.bind(u);class w{static formatTime(e){return new Date(1e3*e)}static formatReply(e){return{pid:e.post_id,tid:+e.thread_id,uid:+e.user.user_id,like:+e.like_count,dislike:+e.dislike_count,score:+e.vote_score,quote:e.quote&&this.formatReply(e.quote),citedBy:+e.no_of_quote,replyTime:this.formatTime(e.reply_time),msg:e.msg}}static formatThread(e){return{tid:+e.thread_id,cid:+e.cat_id,subCid:+e.sub_cat_id,title:e.title,createTime:this.formatTime(e.create_time),updateTime:this.formatTime(e.last_reply_time),uid:+e.user_id,like:+e.like_count,dislike:+e.dislike_count,uniUserReply:+e.no_of_uni_user_reply,remark:e.remark&&e.remark.notice}}static formatThreadDetail(e){return{...this.formatThread(e),replies:e.item_data.map(e=>this.formatReply(e)),pinned:e.pinned_post&&this.formatReply(e.pinned_post)}}static formatThreadInfo(e){return{...this.formatThread(e),lastReplyTime:this.formatTime(e.last_reply_time),lastReplyUid:+e.last_reply_user_id}}static formatThreadMinInfo(e){return{tid:+e.thread_id,cid:+e.cat_id,uid:+e.user_id,title:e.title,score:+e.like_count-+e.dislike_count,replied:e.last_reply_time,pages:+e.total_page}}static formatUserInfo(e){return{uid:+e.user_id,name:e.nickname,gender:e.gender,level:+e.level,levelName:e.level_name,createTime:this.formatTime(e.create_time)}}}const g={put(){}},_=r("https://ipfs.infura.io:5001/"),y=new o({concurrency:10}),T=/https?:\/\/(?:www\.)?na\.cx\/i\/(\w+\.\w+)/g;const $=async e=>{const r=await async function(e,r=!1){const a=await t(e,{headers:{Referer:"https://lihkg.com/","User-Agent":m,Cookie:await d(m)},timeout:p});if(!a.ok)throw new Error(`${e} ${a.status} ${a.statusText}`);return r?a.body:await a.buffer()}(e,!0),o=r.pipe(new s.PassThrough),i=r.pipe(new s.PassThrough),n=y.add(()=>(async e=>{try{let t;for await(const r of _.add(e,{pin:!0}))t=r.cid;return t}catch(e){console.error(e.name,":",e.message)}})(o)),c=await(async e=>{const t=[{content:e}];let r;for await(const e of a(t,g,{onlyHash:!0}))r=e.cid;return r})(i);return n.then(t=>{t&&c&&t.equals(c)?console.log(`uploaded ${e} : ${c}`):console.error(`upload ${e} error: cid mismatches`)}),c.toString()},k=process.env.AUTH_TOKEN;if(!k)throw new Error("AUTH_TOKEN is undefined");const b=new(i.Octokit.plugin(n.retry))({auth:k}),q="lihkg-boy",R="thread-test",E="master",O=e=>{return+e.toString().slice(-1)[0]};class A{constructor(){this.threads={}}add(e,t){const r=O(e);this.threads[r]||(this.threads[r]={}),this.threads[r][e]=t}async commit(e=E){const t=(await b.git.getTree({owner:q,repo:R,tree_sha:e})).data.tree,r={};for(const[e,a]of Object.entries(this.threads)){console.log("subtree",e);const s=t[+e];if(s.path!=e)throw new Error(`tree invalid: ${JSON.stringify(s)}`);const o=s.sha,i=Object.entries(a).map(([e,t])=>({path:`${e}.json`,content:t,mode:"100644"})),n=(await b.git.createTree({owner:q,repo:R,tree:i,base_tree:o})).data.sha;r[e]=n,console.log("updated subtree",e,n)}console.log("updating the root tree");const a=[];let s;t.forEach(e=>{a[e.path]={path:e.path,mode:e.mode,sha:e.sha}}),Object.entries(r).map(([e,t])=>{a[e]={path:e,sha:t,mode:"040000"}}),console.log(a);for(let e=0;e<50;e++)try{s=(await b.git.createTree({owner:q,repo:R,tree:a.filter(Boolean)})).data.sha;break}catch(e){console.error(e)}return console.log("updated root tree",s),s}}const j=async e=>{const t=await f(e),r=w.formatThreadDetail(t);return await(e=>Promise.all(e.replies.map(e=>{const t=[...e.msg.matchAll(T)];return Promise.all(t.map(async t=>{const[r,a]=t;try{const t=await $(r);e.msg=e.msg.replace(r,`https://ipfs.infura.io/ipfs/${t}?filename=${a}`)}catch(e){console.error(e)}}))})))(r),JSON.stringify(r)};(async e=>{const t=await(async(e=15)=>{const t=new Set,r=t=>+new Date-+t>6e4*e;for(let e=1;;e++)try{const{items:a}=await u.fetchLatestThreads(e),s=a.map(e=>[+e.thread_id,w.formatTime(e.last_reply_time)]);if(s.forEach(([e,a])=>{r(a)||t.add(e)}),s.some(([,e])=>r(e)))break}catch(e){console.error(e);break}return[...t].reverse()})(),r=t.length;console.log(r,t);const a=new o({concurrency:e});let s=0;const i=new A;for(let e=0;e<r;e++){const o=t[e];a.add(async()=>{console.log(`update ${o}.json ${e+1}/${r}`);try{const e=await j(o);i.add(o,e),console.log(`success ${o}.json ${s}/${r}`),s++}catch(e){console.error(e.name+" "+e.message)}})}await a.onIdle();const n=await i.commit();await(async(e,t,r=E)=>{const a=`heads/${r}`,s=(await b.git.getRef({owner:q,repo:R,ref:a})).data.object.sha;console.log("old commit",s);const o=await b.git.createCommit({owner:q,repo:R,tree:e,message:t,parents:[s],author:{email:"lihkg@github.com",name:"lihkg"}}),i=o.data.sha;o.data.tree=void 0,console.log("new commit",o.data),await b.git.updateRef({owner:q,repo:R,ref:a,sha:i})})(n,`${(new Date).toISOString()} update\n${t.join(",")}`),console.log(`${s}/${r} success`)})(200)}();
