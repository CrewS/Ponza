function ajax_post(url, params, success_callback, fail_callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    let formData = new FormData();
    if (params !== null) {
        for (let i = 0; i < params.length; i++) {
            formData.append(params[i][0],params[i][1])
        }
        xhr.send(formData);
    } else {
        xhr.send();
    }
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                success_callback(xhr.responseText)
            } else {
                fail_callback(xhr.status)
            }
        }
    }
}

let page;
let server;
let key;

function Ponza(domId,option){
    page = option.page;
    server = option.server;
    key = option.key;
    // 获取 scritp 文件
    document.getElementById(domId).innerHTML +=
        `<div class="ponza-main">
        <!--这里放留言的列表-->
        <div id="ponza-comm-list">

        </div>
        <!--这里放留言的输入框-->
        <div class="ponza-editor gradient-wrapper">
            <div class="ponza-editor-nav">
                <div class="ponza-copyright">
                    <p >Comment system powered by <a class="ponza-copyright-href" href="https://github.com/Ericwyn/Ponza">Ponza</a></p>
                </div>
                <div class="ponza-editor-error" id="ponza-editor-error"></div>
            </div>

            <div class="ponza-editor-body">
                <div style="box-sizing: border-box;">
                    <textarea placeholder="请在此留言" id="ponza-input-comm"></textarea>
                </div>
            </div>
        </div>

        <div class="ponza-user-set gradient-wrapper">
            <div style="display: inline">
                <input class="ponza-editor-input" id="ponza-input-name" placeholder="昵称">
                <input class="ponza-editor-input" id="ponza-input-site" placeholder="网址">
                <button class="ponza-editor-button" id="ponza-submit-btn" onclick="submit()">提 交</button>
            </div>
        </div>
    </div>`;
    getComm();

    if (localStorage.getItem("ponzaName") != null){
        document.getElementById("ponza-input-name").value = localStorage.getItem("ponzaName");
    }
    if (localStorage.getItem("ponzaSite") != null){
        document.getElementById("ponza-input-site").value = localStorage.getItem("ponzaSite");
    }
}

// 获取一篇文章的评论
function getComm(){
    ajax_post(
        server+"/api/getComm",
        [
            ["key", key],
            ["page",page],
        ],
        function (resp) {
            document.getElementById("ponza-comm-list").innerHTML = "";
            let json = JSON.parse(resp);
            // 如果还有 init 页面的话就先 init
            if (json.code === "4003") {
                initComm(function () {
                    getComm();
                });
            }else {
                // 将数据显示出来
                for (let i = json.comment.length-1; i >= 0;i--){
                    let comm = json.comment[i];
                    document.getElementById("ponza-comm-list").innerHTML
                        += bindComment(comm.name, comm.time, comm.agent, comm.comm, comm.site);
                }
            }
        },
        function (status) {
            console.log("ponza get comment error : "+status)
        }
    )
}

// 初始化一篇文章的评论
function initComm(callback){
    ajax_post(
        server+"/api/initComm",
        [
            ["key", key],
            ["page",page],
        ],
        function (resp) {
            console.log(resp);
            callback();
        },
        function (status) {
            console.log("error : "+status)
        }
    )
}

// 上传一篇文章的评论
function uploadComm(comm, name, site){
    ajax_post(
        server+"/api/uploadComm",
        [
            ["key", key],
            ["page", page],
            ["comm", comm],
            ["name", name],
            ["site", site],
        ],
        function (resp) {
            let json = JSON.parse(resp);
            getComm();
        },
        function (status) {
            console.log("error : "+status)
        }
    )
}

// 绑定评论视图
function bindComment(name, time, agent, comm, site) {
    if (site.trim() != ""){
        if (!site.startsWith("https://") && !site.startsWith("http://")) {
            site = "http://" + site;
        }
        site = "href=\""+site+"\""
    }
    return `<div class="ponza-card gradient-wrapper">
                <div class="ponza-card-title">
                    <span style="font-weight: bold"><a ${site} >${name}</a></span> 在 ${time} 的评论，来自 ${agent}
                    <div class="ponza-card-like-btn">
                        <!--<svg class="ponza-card-like-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><path d="M25 39.7l-.6-.5C11.5 28.7 8 25 8 19c0-5 4-9 9-9 4.1 0 6.4 2.3 8 4.1 1.6-1.8 3.9-4.1 8-4.1 5 0 9 4 9 9 0 6-3.5 9.7-16.4 20.2l-.6.5zM17 12c-3.9 0-7 3.1-7 7 0 5.1 3.2 8.5 15 18.1 11.8-9.6 15-13 15-18.1 0-3.9-3.1-7-7-7-3.5 0-5.4 2.1-6.9 3.8L25 17.1l-1.1-1.3C22.4 14.1 20.5 12 17 12z"></path></svg>-->
                        <span></span>
                    </div>
                </div>
                <div class="ponza-card-body">
                    ${comm}
                </div>`
}

function submit() {
    let comm = document.getElementById("ponza-input-comm").value;
    let name = document.getElementById("ponza-input-name").value;
    let site = document.getElementById("ponza-input-site").value;
    let reg = /^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+(:\d+)*/;
    if (name.length > 20){
        name = name.substr(0,20);
    }
    if (site.length > 40){
        site = site.substr(0,40);
    }
    if (name.trim() == ""){
        document.getElementById("ponza-editor-error").innerHTML="请输入昵称";
        return
    }
    localStorage.setItem("ponzaName",name);
    if (site.trim() != ""){
        if (!reg.test(site)){
            document.getElementById("ponza-editor-error").innerHTML="个人网址错误";
            return
        }
        localStorage.setItem("ponzaSite",site);
    }

    if (comm.trim() == ""){
        document.getElementById("ponza-editor-error").innerHTML="无法提交空白评论";
        return
    }
    comm = comm.replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>').replace(/\s/g, '&nbsp');
    if (!getLastSubmitTime()) {
        document.getElementById("ponza-editor-error").innerHTML="请求过快，稍后再试";
        return
    }
    uploadComm(comm,name,site);
    localStorage.setItem("ponzaLastTime",Date.parse(new Date()));
    document.getElementById("ponza-input-comm").value = "";
}

function getLastSubmitTime() {
    if (localStorage.getItem("ponzaLastTime") == null){
        return true
    }else {
        let timeStamp = localStorage.getItem("ponzaLastTime");
        if ((Date.parse(new Date()) - timeStamp) / 1000 > (60 * 3)){
            return true
        }else {
            return false
        }
    }
}