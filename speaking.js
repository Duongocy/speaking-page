const practice_container = document.getElementById('practiceContainer');
const lesson_list_container = document.getElementById('lessonListContainer');
const record_button=document.getElementById('recordButton');
const text_from_voice=document.getElementById('recordText');
const record_button_container = document.getElementById('recordButtonContainer');
const url_api = 'https://english-learning-api-qof2.onrender.com';
// const url_api = 'http://localhost:3003';
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
          div.textContent = element.word_sentence +' -- '+element.vi;
          div.addEventListener("click", function () { 
            speak(element.word_sentence);
        })
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
let mediaRecorder; // đối tượng MediaRecorder
let chunks = [];   // mảng chứa dữ liệu âm thanh
let stream;        // giữ stream mic
let isRecording = false;

// Khi nhấn nút
record_button.onclick = async function () {
  console.log("===> record_button clicked, isRecording:", isRecording);

  if (!isRecording) {
    // ---- START RECORD ----
    try {
      console.log(">> Xin quyền micro...");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      isRecording = true;
      record_button.style.backgroundColor = "#e70826ff";

      // Khi có data
      mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
      };

      // Khi stop
      mediaRecorder.onstop = async () => {
        console.log(">> Ghi âm dừng, tạo blob...");
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];

        const formData = new FormData();
        formData.append("audio", blob, "speech.webm");

        try {
          console.log(">> Gửi audio lên server...");
          const res = await fetch("https://voice-recognize.onrender.com/stt", {
            method: "POST",
            body: formData
          });
          const data = await res.json();

          let text = data.text 
            ? String(data.text).charAt(0).toUpperCase() + String(data.text).slice(1)
            : data.error || "(no speech)";
          text_from_voice.innerText = text;

          kiem_tra_ket_qua_doc("practiceContainer", text);
        } catch (err) {
          console.error(">> Fetch error:", err);
          text_from_voice.innerText = "Error: " + err.message;
        } finally {
          cleanup();
        }
      };

      mediaRecorder.start();
      console.log(">> Ghi âm bắt đầu...");
      startRecording(stream);

    } catch (err) {
      console.error(">> Không lấy được micro:", err);
      text_from_voice.innerText = "Micro permission denied!";
    }

  } else {
    // ---- STOP RECORD ----
    console.log(">> Stop record...");
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    stopRecording();
    record_button.style.backgroundColor = "#2df705";
  }
};

// Hiệu ứng vòng ripple
function startRecording(stream) {
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  function createRipple() {
    analyser.getByteFrequencyData(dataArray);
    let sum = dataArray.reduce((a, b) => a + b, 0);
    let volume = sum / dataArray.length;

    if (volume > 10) {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      document.getElementById("recordButtonContainer").appendChild(ripple);
      ripple.style.backgroundColor = `hsl(${volume % 360}, 100%, 80%)`;
      ripple.style.width = `${volume}px`;
      ripple.style.height = `${volume}px`;
      setTimeout(() => ripple.remove(), 70);
    }
  }

  rippleInterval = setInterval(createRipple, 70);
}

function stopRecording() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  clearInterval(rippleInterval);
  rippleInterval = null;
}

// Cleanup toàn bộ
function cleanup() {
  console.log(">> Cleanup...");
  stopRecording();

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  mediaRecorder = null;
  isRecording = false;
  record_button.style.backgroundColor = "#2df705";
}
function kiem_tra_ket_qua_doc(parentId, text) {
    const parent = document.getElementById(parentId);
    const children = parent.querySelectorAll("div");
    let confirm=true;
    children.forEach(child => {
      if (child.textContent.split("--")[0].trim() === text&&confirm) {
        child.classList.add("fade-out");
        setTimeout(() => child.remove(), 500); // delay bằng transition
        sound_ok.play();
        confirm = false;
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

let audioContext, analyser, source, dataArray;
let rippleInterval;

