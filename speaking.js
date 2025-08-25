const practice_container = document.getElementById('practiceContainer');
const lesson_list_container = document.getElementById('lessonListContainer');
const record_button=document.getElementById('recordButton');
const text_from_voice=document.getElementById('recordText');
const url_api = 'https://learning-english-api-o1yh.onrender.com';
let textArray=[];
let sound_ok = new Audio("sound-ok.mp3"); // đường dẫn file âm thanh
let sound_ng = new Audio("sound-ng.mp3"); // đường dẫn file âm thanh
load_lesson_list_from_database();

    
function display_practice_list(data, delay,classname) {
      practice_container.innerHTML = ""
      data.forEach((element, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = classname;
          div.style.animationDelay = `${index * 0.1}s`; // nhỏ delay cho mượt
          div.textContent = element.word_sentence;
          practice_container.appendChild(div);
        }, index * delay);
      });
    }
function display_lesson_list(data, delay,classname) {
      lesson_list_container.innerHTML = ""
      data.forEach((element, index) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = classname;
          div.style.animationDelay = `${index * 0.1}s`; // nhỏ delay cho mượt
          div.textContent = element.lesson_title;
          // thêm sự kiện click
          div.addEventListener("click", () => {
            textArray=[];
            // xóa active của tất cả div trong lesson_list_container
              lesson_list_container.querySelectorAll("." + classname).forEach(el => {
                el.classList.remove("active");
              });
            // thêm active cho div vừa click
              div.classList.add("active");
              load_practice_from_database(element.lesson_id);
          });
          lesson_list_container.appendChild(div);          
        }, index * delay);
      });
    }    
async function load_practice_from_database(lessonId){
  let request_string = url_api+'/Invoice?yeucau=wordsentencelist';
    fetch(request_string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lesson_id: lessonId })
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function (data) {
        console.log("Word sentence list nè : ",data);
        textArray = data.map(item => item.word_sentence);
        console.log("Danh sách câu : ",textArray);
        display_practice_list(data,100,'practice-item');
    })
    .catch(function(error) {
        console.error('Error:', error.message); // In ra thông điệp lỗi
    });
}
async function load_lesson_list_from_database(){
    let request_string = url_api+'/Invoice?yeucau=lessonlist';
    fetch(request_string, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${token}`
            'Authorization': `Bearer`
        }
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function (data) {
        /////////////////////////////////////////////
        // textArray = data.map(item => item.lesson_title);
        // console.log(textArray);
        display_lesson_list(data,100,'lesson-item');
    })
    .catch(function(error) {
        console.error('Error:', error.message); // In ra thông điệp lỗi
    });
}
////////////////////////////////////voice recognize////////////////////////////////////
let mediaRecorder;//biến để lưu đối tượng mediarecorder dùng để ghi âm
let chunks = [];//mảng chứa các mẩu nhỏ của âm thanh trong suốt quá trình ghi âm
let stream; // giữ thông tin của mic đang sử dụng để có thể tắt mic sau khi dùng xong
record_button.onclick = async function () {
  if (!mediaRecorder || mediaRecorder.state === "inactive") { //nếu chưa đang ghi âm hoặc trạng thái của biến mediarecorder là không hoạt động thì sẽ bắt đầu ghi âm
    // xin quyền micro
    stream = await navigator.mediaDevices.getUserMedia({ audio: true }); //xin quyền truy cập micro
    mediaRecorder = new MediaRecorder(stream);//tạo 1 đối tượng ghi âm mới nếu được cấp quyền truy cập

    mediaRecorder.ondataavailable = function (e) { //nếu phát hiện có âm thanh (do quá trình ghi âm) phát sinh trong biến mediarecorder thì đưa nó vào mảng chunks
      chunks.push(e.data); //cần khai báo sự kiện này trước để sẵn sàng trước khi bật mic (mediaRecorder.start();) để không bỏ lỡ bất kì mẫu dữ liệu nào 
    };

    mediaRecorder.onstop = async function () {//hàm thực hiện khi có sự kiện việc ghi âm kết thúc (nhờ nhấn nút)
      const blob = new Blob(chunks, { type: "audio/webm" }); //gom các mẩu âm thanh trong mảng chunks lại thành 1 file tên là blob ddihnj dạng đuôi là webm
      chunks = []; //xóa mảng chunks để còn sử dụng cho lần ghi âm sau 

      const formData = new FormData();//tạo 1 form mới để chuẩn bị cho việc gởi dữ liệu âm thanh lên sever 
      formData.append("audio", blob, "speech.webm"); //thêm dữ liệu âm thanh (file blob) vào form và đặt tên  trường dữ liệu là audio, dữ liệu được thêm vào là blob

      try {
        const res = await fetch("https://voice-recognize.onrender.com/stt", {  //gởi dữ liệu lên api
          method: "POST",
          body: formData
        });
        const data = await res.json(); //chờ nhận lại dữ liệu trả về từ api
        text_from_voice.innerText = String(data.text).charAt(0).toUpperCase() + String(data.text).slice(1) || data.error || "(no speech)"; //lấy ra text từ dữ liệu trả về và hiển thị lên
        console.log(String(data.text).charAt(0).toUpperCase() + String(data.text).slice(1));
        kiem_tra_ket_qua_doc('practiceContainer',String(data.text).charAt(0).toUpperCase() + String(data.text).slice(1));
      } catch (err) {
        text_from_voice.innerText = "Error: " + err.message; // lỗi thì báo        
      } finally {
        // tắt mic sau khi xử lý xong
        if (stream) {
          stream.getTracks().forEach(function (track) {
            track.stop();
          });
          stream = null;
        }
      }
    };

    mediaRecorder.start();
    console.log("Đang nghe...");
    record_button.style.backgroundColor="#e70826ff";
  } else if (mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    console.log("Đang xử lý..");
    record_button.style.backgroundColor="#2df705";
  }
};
function kiem_tra_ket_qua_doc(parentId, text) {
    const parent = document.getElementById(parentId);
    const children = parent.querySelectorAll("div");
    let confirm=true;
    children.forEach(child => {
      if (child.textContent.trim() === text&&confirm) {
        child.remove();
        sound_ok.play();
        confirm = false;
        return;
      }
    });
  }
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // chọn tiếng Anh Mỹ
    utterance.rate = 0.9;     // đọc hơi chậm lại
    utterance.pitch = 1.2;    // giọng cao một xíu
    speechSynthesis.speak(utterance);
}