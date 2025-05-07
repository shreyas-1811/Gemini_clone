const typingForm=document.querySelector(".typing-form");
const chatList=document.querySelector(".chat-list");
const suggestions=document.querySelectorAll(".suggestion-list .suggestion")
const toggleThemeButton=document.querySelector("#toggle-theme-button");
const deleteChatButton=document.querySelector("#delete-chat-button");

let userMessage=null;
let isResponseGenerating=false;

//API configuration
const API_KEY="AIzaSyCZHuwrVmIJ5dAe-TBmvRczf6s5LD7ViG8";
const API_URL=`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalstorageData=()=>{
    const savedChats=localStorage.getItem("savedChats");
    const isLightMode =(localStorage.getItem("themeColor")=== "light_mode") ;     //getting the local storage themeColor value
   
   //apply the stored theme
    document.body.classList.toggle("light_mode",isLightMode);
    toggleThemeButton.innerText=isLightMode ? "dark_mode": "light_mode";
    chatList.innerHTML=savedChats || "";
    document.body.classList.toggle("hide-header",savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);//Scroll to the bottom

}
loadLocalstorageData();




//creating a new element and returning it
const createMessageElement =(content,...classes)=>{
   const div=document.createElement("div");
   div.classList.add("message", ...classes);
   div.innerHTML=content;
   return div;
}

//typing effect
const showTypingEffect=(text,textElement,incomingMessageDiv)=>{
  const words=text.split(' ');
  let currentWordIndex=0;

  const typingInterval=setInterval(()=>{
    //Append eachword to the text element with a space
      textElement.innerText += (currentWordIndex ===0 ? '' :' ')+ words[currentWordIndex++];
      incomingMessageDiv.querySelector(".icon").classList.add("hide");//hiding copy icon while response is being typed
      //if all words are displayed
      if(currentWordIndex=== words.length){
          clearInterval(typingInterval);
          isResponseGenerating=false;//Setting isResponseGenerating to false once the response is typed 
          incomingMessageDiv.querySelector(".icon").classList.remove("hide");//making copy icon visible  after response
          localStorage.setItem("savedChats", chatList.innerHTML);//chat list content will be saved to local storage 
          
        
        }
        chatList.scrollTo(0, chatList.scrollHeight);//Scroll to the bottom
    },75);
}


//Fetch response from the API based on user message
const generateAPIResponse=async (incomingMessageDiv)=>{
    const textElement=incomingMessageDiv.querySelector(".text");//get text element


    // send a post request to the API with the user's message
   try{
     const response=await fetch(API_URL,{
        method: "POST",
        headers:{"Content-Type": "application/json"},
        body:JSON.stringify({
            contents:[{
                role:"user",
                parts:[{text:userMessage}]
            }]
        })
     });

     const data=await response.json();
     if(!response.ok) throw new Error(data.error.message);

     //get api response text amd remove asterisks from it [The API responds with markup language,using astericks for bold text]
  const apiResponse=data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1' );
showTypingEffect(apiResponse,textElement,incomingMessageDiv);

   }catch(error){
    isResponseGenerating=false;//Setting isResponseGenerating to false once if an error occurs
    textElement.innerText=error.message;
    textElement.classList.add("error");
   }finally{
    incomingMessageDiv.classList.remove("loading");
   }
}


//Show loading animation while waiting for the API response
const showLoadingAnimation=()=>{
    const html= `<div class="message-content">
    <img src="images/google-gemini-icon.webp" alt="Gemini Image" class="avatar">
    <p class="text"></p>
    <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
    </div>
</div>
<span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span> `;

const incomingMessageDiv= createMessageElement(html,"incoming", "loading");

chatList.appendChild(incomingMessageDiv);

chatList.scrollTo(0, chatList.scrollHeight);//Scroll to the bottom
generateAPIResponse(incomingMessageDiv);
}



//copy message text to the clipboard
const copyMessage=(copyIcon)=>{
    const messageText=copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText="done";
    setTimeout(()=>{
        copyIcon.innerText="content_copy";//Revert icon after 1 sec
    },1000);
}


//Handle sending outgoing chat message
const  handleOutgoingChat =()=>{
   userMessage=typingForm.querySelector(".typing-input").value.trim() || userMessage;
   if(!userMessage || isResponseGenerating) return; //exit if there is no message or response is generating

   isResponseGenerating=true;

  const html=` <div class="message-content">
            <img src="images/user.jpg" alt="User Image" class="avatar">
            <p class="text"></p>
        </div>`;

    const outgoingMessageDiv= createMessageElement(html,"outgoing");
    outgoingMessageDiv.querySelector(".text").innerText=userMessage;
    chatList.appendChild(outgoingMessageDiv);



    typingForm.reset();//clear input field
    chatList.scrollTo(0, chatList.scrollHeight);//Scroll to the bottom
    document.body.classList.add("hide-header");//hide the header once chat starts
    setTimeout(showLoadingAnimation,500);//show loading animation after a delay
}


//Getting the text element of the clicked suggestion and passing it's content as usermessage
suggestions.forEach(suggestion=>{
    suggestion.addEventListener("click",()=>{
       userMessage = suggestion.querySelector(".text").innerText;
       handleOutgoingChat();
    });
});


//Toggle between light and dark themes
toggleThemeButton.addEventListener("click",()=>{
   const isLightMode= document.body.classList.toggle("light_mode");
   localStorage.setItem("themeColor", isLightMode ? "light_mode": "dark_mode");//saving selected theme on browser local storage by themeColor name
    toggleThemeButton.innerText=isLightMode ? "dark_mode": "light_mode";
});




//delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click",()=>{
    if(confirm ("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

//to handle outgoing chat
typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();//prevent default form submission


    handleOutgoingChat();
});