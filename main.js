let canvas=document.getElementById('canvas')
ww=1600
wh=800
let ctx=canvas.getContext('2d')
mysize()
let fps=50
let ws=[]
let tt=0

let world_
let car1
let car2
let barriers=[]
let information

let mode=0
let start=false
let end=false
let names=["Player1  VS  Player2",
            "Player  VS  EnemyX",
            "Player  VS  EnemyY",
            "Player  VS  EnemyZ"]
let introductions=["two players fight against each other",
                    "EnemyX can only fire when it is close enough",
                    "EnemyY can fire from a long distance but has poor accuracy",
                    "EnemyZ can fire from a long distance and has good accuracy"]



let keys={}
function init(){

    world_=new world(0,0,10)


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
    if(start){
        if(car1.hp<=0||car2.hp<=0){
            end=true
        }
        if(mode>0){
            //NPC mode
            let fire_angle
            let fire_distance
            switch(mode){
                case 1:
                    fire_angle=1
                    fire_distance=150
                    break
                case 2:
                    fire_angle=0.5
                    fire_distance=Infinity
                    break
                case 3:
                    fire_angle=0.01
                    fire_distance=Infinity
            }
            let p21=myVector.minus(car1.position,car2.position)
            let a21=myVector.deg(p21)
            let theta=a21-car2.angle-Math.PI/2
            if(theta>Math.PI){
                theta-=Math.PI*2
            }
            if(theta<-Math.PI){
                theta+=Math.PI*2
            }
            keys_s={}
            keys_s['Numpad4']=true
            keys_s['Numpad6']=true
            if(theta>0){
                keys_s['Numpad7']=true
                keys_s['Numpad9']=false
                car2.keyup({code:'Numpad9'})
            }else if(theta<0){
                keys_s['Numpad7']=false
                keys_s['Numpad9']=true
                car2.keyup({code:'Numpad7'})
            }
            car2.update(keys_s)
            if(Math.PI-Math.abs(theta)<fire_angle&&myVector.abs(p21)<fire_distance){
                car2.fire()
            }
        }else{
            //Player mode
            car2.update(keys)
        }
        

        car1.update(keys)
        
        
        


        world_.update(1/fps)
    }

}

function draw(){
    ctx.fillStyle='black'
    ctx.fillRect(0,0,1600,1000)

    if(start){
        car1.draw()
        car2.draw()
        for(let i of ws){
            world.draw_helper(i,'yellow')
        }
        for(let i of barriers){
            world.draw_helper(i,'rgb(200,100,50)')
        }
        if(car1.hp<=0||car2.hp<=0){
            let text
            if(car1.hp<=0){
                text=names[mode].split("  ")[2]+" WIN"
            }
            if(car2.hp<=0){
                text=names[mode].split("  ")[0]+" WIN"
            }
            ctx.font='55px serif'
            ctx.fillStyle='white'
            ctx.fillText(text,800-ctx.measureText(text).width/2,350)
            ctx.font='80px serif'
            ctx.globalAlpha=0.3
            ctx.fillText("H",720-ctx.measureText("H").width/2,430)
            ctx.fillText("R",880-ctx.measureText("R").width/2,430)
            ctx.globalAlpha=1
            ctx.font='30px serif'
            ctx.fillText("HOME",720-ctx.measureText("HOME").width/2,420)
            ctx.fillText("RESTART",880-ctx.measureText("RESTART").width/2,420)
        }
    }else{
        ctx.fillStyle='white'
        ctx.globalAlpha=0.2
        ctx.font='265px serif'
        ctx.fillText("ENTER",800-ctx.measureText("ENTER").width/2,350)
        ctx.fillText("TO START",800-ctx.measureText("TO START").width/2,600)
        ctx.globalAlpha=1
        ctx.fillStyle='white'
        ctx.font='65px serif'
        ctx.fillText(names[mode],800-ctx.measureText(names[mode]).width/2,350)
        ctx.font='40px serif'
        ctx.fillText(introductions[mode],800-ctx.measureText(introductions[mode]).width/2,450)
        ctx.strokeStyle='white'
        ctx.beginPath()
        ctx.moveTo(200,400)
        ctx.lineTo(250,360)
        ctx.lineTo(250,440)
        ctx.closePath()
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(1400,400)
        ctx.lineTo(1350,360)
        ctx.lineTo(1350,440)
        ctx.closePath()
        ctx.stroke()
    }
    information.draw()

    requestAnimationFrame(draw)
}

function keydown(e){
    if(start){
        keys[e.code]=true
        car1.keydown(e)
        if(mode==0){
            car2.keydown(e)
        }else if(e.code=='Space'){
            car2.hpbar_transparent=2
        }
        if(end){
            if(e.code=='KeyH'||e.code=='KeyR'){
                ws=[]
                barriers=[]
                init()
                if(e.code=='KeyH'){
                    start=false
                }
                end=false
            }
        }
    }else{
        switch(e.code){
            case 'ArrowRight':
                mode+=1
                if(mode>=names.length){
                    mode=0
                }
                break
            case 'ArrowLeft':
                mode-=1
                if(mode<0){
                    mode=names.length-1
                }
                break
            case 'Enter':
                start=true
                break
        }

    }
    if(e.code=='KeyI'){
        information.state=(information.state-1)**2
    }
    
    

}
function keyup(e){
    if(start){
        keys[e.code]=false
        car1.keyup(e)
        if(mode==0){
            car2.keyup(e)
        }
    }
}
function onclick(e){
    let point=get_p_in_world(e.pageX,e.pageY)
    information.onclick(point)
    if(!start){
        if(360<point[1]&&point[1]<440){
            if(200<point[0]&&point[0]<250){
                mode-=1
                if(mode<0){
                    mode=names.length-1
                }
            }else if(1350<point[0]&&point[0]<1400){
                mode+=1
                if(mode>=names.length){
                    mode=0
                }
            }
        }
    }
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

































