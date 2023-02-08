let canvas=document.getElementById('canvas')
ww=1600
wh=800
let ctx=canvas.getContext('2d')
mysize()
let fps=50
let ws=[]
let tt=0


let car1
let car2
let barriers=[]
let information





let world_=new world(0,0,10)
let keys={}
function init(){



    ws.push(new polygon(800,800,[[-800,-10],[800,-10],[800,10],[-800,10]],Infinity))
    ws.push(new polygon(800,0,[[-800,-10],[800,-10],[800,10],[-800,10]],Infinity))
    ws.push(new polygon(1600,500,[[-10,-500],[10,-500],[10,500],[-10,500]],Infinity))
    ws.push(new polygon(0,500,[[-10,-500],[10,-500],[10,500],[-10,500]],Infinity))
    for(let i of ws){
        i.isgravity=false
        world_.add(i)
    }

    for(let i=0;i<10;i++){
        let r=Math.random()*100+50
        let ps=[]
        for(let rad=0;rad<Math.PI*2;rad+=Math.random()*1+1){
            let p0=[r*Math.cos(rad),r*Math.sin(rad)]
            ps.push(p0)
        }
        b0=new polygon(Math.random()*1400+100,Math.random()*600+100,ps,r**2/100)
        b0.velocity=[Math.random()*40-20,Math.random()*40-20]
        b0.omega[2]=Math.random()-0.5
        b0.mass=b0.area*0.001
        world_.add(b0)
        barriers.push(b0)
    }



    car1=new Car(100,100)
    world_.add(car1)
    car1.velocity=[100,0]
    car1.color='red'

    car2=new Car(1500,700)
    world_.add(car2)
    car2.velocity=[-100,0]
    car2.color='orange'
    car2.control_keys={lf:'Numpad7',lb:'Numpad4',rf:'Numpad9',rb:'Numpad6',fire:'Numpad0'}

    information=new Information(1550,50)
 



    world_.setCoefficient('default','default',1,0.5)


    window.addEventListener('keydown',keydown)
    window.addEventListener('keyup',keyup)
    document.addEventListener('click',onclick)

    
}


function update(){

    tt+=1000/fps


    car1.update(keys)
    car2.update(keys)
    

    world_.update(1/fps)

}

function draw(){
    ctx.fillStyle='black'
    ctx.fillRect(0,0,1600,1000)

    car1.draw()
    car2.draw()
    

    for(let i of ws){
        world.draw_helper(i,'yellow')
    }
    for(let i of barriers){
        world.draw_helper(i,'rgb(200,100,50)')
    }
    information.draw()

    requestAnimationFrame(draw)
}

function keydown(e){
    keys[e.code]=true
    car1.keydown(e)
    car2.keydown(e)

}
function keyup(e){
    keys[e.code]=false
    car1.keyup(e)
    car2.keyup(e)
}
function onclick(e){
    information.onclick(get_p_in_world(e.pageX,e.pageY))
}


function mysize(){
	if(window.innerHeight/window.innerWidth>=wh/ww){
		canvas.style.width=window.innerWidth+'px'
		canvas.style.height=wh*window.innerWidth/ww+'px'
		canvas.width=window.innerWidth
		canvas.height=wh*window.innerWidth/ww
		canvas.position='absolute'
		canvas.left=window.innerWidth-canvas.width/2
		canvas.top=0
		canvas.style.position='absolute'
		canvas.style.left=0+'px'
		canvas.style.top=0+'px'
	}else{
		canvas.style.width=ww*window.innerHeight/wh+'px'
		canvas.style.height=window.innerHeight+'px'
		canvas.width=ww*window.innerHeight/wh
		canvas.height=window.innerHeight
		canvas.style.position='absolute'
		canvas.style.left=(window.innerWidth-canvas.width)/2+'px'
		canvas.style.top=0+'px'
		
	}
	ctx.restore()

	if(window.innerHeight/window.innerWidth>=wh/ww){
		ctx.scale(window.innerWidth/ww,window.innerWidth/ww)
	}else{
		ctx.scale(window.innerHeight/wh,window.innerHeight/wh)
	}
	
	
}


function get_p_in_world(x,y){
	let fx=(x-parseFloat(canvas.style.left))*ww/canvas.width
	let fy=(y-parseFloat(canvas.style.top))*ww/canvas.width
	return [fx,fy]
}

init()
setInterval(update,1000/fps)
draw()

































