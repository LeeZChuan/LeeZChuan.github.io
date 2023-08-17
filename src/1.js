setTimeout( () => {
    setTimeout( () => {
        setTimeout( () => {
            XXXX
        },1000)
    },1000)
},1000)



console.log('1')
 
setTimeout(()=>{
    console.log('2')  
},0)
 
Promise.resolve().then((a)=>{
    console.log('3') 
})
 
new Promise((resolve)=>{
    console.log('4')
    resolve()
    console.log('5')
}).then(()=>{
    console.log('6') 
})

new Promise((resolve)=>{
    setTimeout(() => {
        resolve();
    }, 100); 
}).then(() => {
    console.log('7'); 
});


1 4 5 3 6 2 7