class Car extends polygon{
    constructor(x,y){
        super(x,y,[[0,0],[70,0],[75,25],[70,50],[0,50],[-5,25]],10,'defult',0.3,0.7)
        this.add_force('rf',[30,0],[0,0])
        this.add_force('rb',[30,0],[0,0])
        this.add_force('lf',[-30,0],[0,0])
        this.add_force('lb',[-30,0],[0,0])
        this.power={rf:0,rb:0,lf:0,lb:0}
        this.bullets=[]
        this.control_keys={rf:'KeyY',rb:'KeyG',lf:'KeyE',lb:'KeyD',fire:'KeyV'}
        this.cooldown=0
        this.hp=5
        this.hpbar_transparent=2
        this.color='red'
        this.collision=(e)=>{
            if(e.object.type==='ball'){
                this.hp-=1
                this.hpbar_transparent=2
            }
        }

    }
    fire(){
        if(this.cooldown<=0){
           this.cooldown=1
            let p=myVector.add(this.position,myVector.rotate([0,-35],this.angle))
            let bb=new Bullet(p[0],p[1],this)
            bb.velocity=myVector.add(this.velocity,myVector.rotate([0,-3000],this.angle))
            this.velocity=myVector.minus(this.velocity,myVector.rotate([0,-300],this.angle))
            this.world.add(bb)
            this.bullets.push(bb) 
        }
        
    }
    keydown(e){
        if(e.code===this.control_keys.fire){
            this.fire()
        }
        if(e.code==='Space'){
            this.hpbar_transparent=2
        }
    }
    keyup(e){
        for(let i in this.control_keys){
            if(e.code===this.control_keys[i]&&i!=='fire'){
                this.get_force(i).force=[0,0]
                this.power[i]=0
                break
            }
            
        }

    }
    update(keys){
        this.cooldown-=1/50
        if(this.hpbar_transparent>0&&this.hp>0){
            this.hpbar_transparent-=0.01
            if(this.hpbar_transparent<0){
                this.hpbar_transparent=0
            }
        }
        for(let i of this.bullets){
            i.update()
        }

        if(keys[this.control_keys.lb]){
            this.get_force('lb').force=myVector.rotate([0,-1000],this.angle)
            this.power.lb+=1
        }
        if(keys[this.control_keys.lf]){
            this.get_force('lf').force=myVector.rotate([0,1000],this.angle)
            this.power.lf+=1
        }
        if(keys[this.control_keys.rf]){
            this.get_force('rf').force=myVector.rotate([0,1000],this.angle)
            this.power.rf+=1
        }
        if(keys[this.control_keys.rb]){
            this.get_force('rb').force=myVector.rotate([0,-1000],this.angle)
            this.power.rb+=1
        }
    }
    draw(ctx_=ctx){
        let color=this.color
        //draw bullets
        for(let i of this.bullets){
            i.draw()
        }

        //draw car
        ctx_.save()
        ctx_.translate(this.position[0],this.position[1])
        ctx_.rotate(this.angle)
            //body
            ctx_.fillStyle=color
            ctx_.fillRect(-20,-25,40,50)
            //left engine
            ctx_.beginPath()
            ctx_.moveTo(-25,25)
            ctx_.lineTo(-20,0)
            ctx_.lineTo(-25,-25)
            ctx_.lineTo(-35,-25)
            ctx_.lineTo(-40,0)
            ctx_.lineTo(-35,25)
            ctx_.closePath()
            ctx_.fill()
            //right engine
            ctx_.beginPath()
            ctx_.moveTo(25,25)
            ctx_.lineTo(20,0)
            ctx_.lineTo(25,-25)
            ctx_.lineTo(35,-25)
            ctx_.lineTo(40,0)
            ctx_.lineTo(35,25)
            ctx_.closePath()
            ctx_.fill()
            //canon
            ctx_.beginPath()
            ctx_.arc(0,5,15,0,Math.PI*2)
            ctx_.closePath()
            ctx_.fillStyle='rgb(100,100,100)'
            ctx_.fill()
            ctx_.fillStyle='rgb(100,100,100)'
            ctx_.fillRect(5-10,0-40,10,40)
            //power
            let grd=ctx_.createLinearGradient(-5,0,5,0)
            grd.addColorStop(0,'blue')
            grd.addColorStop(0.5,'white')
            grd.addColorStop(1,'blue')
            ctx_.fillStyle=grd
            for(let i in this.power){
                if(this.power[i]!==0){
                    let length=40*this.power[i]/5
                    ctx_.save()

                    let x_
                    let y_
                    let isupsidedown=false
                    if(i==='lf'||i==='lb'){
                        x_=-30
                        if(i=='lf'){
                            y_=-25
                        }else{
                            y_=25
                            isupsidedown=true
                        }
                    }else{
                        x_=30
                        if(i==='rf'){
                            y_=-25
                        }else{
                            y_=25
                            isupsidedown=true
                        }
                    }
                    
                    ctx_.translate(x_,y_)
                    if(isupsidedown){
                        ctx_.rotate(Math.PI)
                    }
                    ctx_.beginPath()
                    ctx_.moveTo(-5,0)
                    ctx_.lineTo(5,0)
                    ctx_.lineTo(0,-length)
                    ctx_.closePath()
                    ctx_.fill()
                    ctx_.restore()
                    this.power[i]%=5
                }
                
            }

            //draw hp bar
            ctx_.globalAlpha=this.hpbar_transparent
            ctx_.rotate(-this.angle)
            ctx_.fillStyle='rgb(0,225,0)'
            ctx_.fillRect(-40,-60,80*this.hp/5,10)
            ctx_.strokeStyle='white'
            ctx_.lineWidth =3
            ctx_.strokeRect(-40,-60,80,10)
            ctx_.globalAlpha=1

            







        ctx_.restore()
        
    }
}
class Bullet extends ball{
    constructor(x,y,car){
        super(x,y,5,1)
        this.car=car
        this.collision=(e)=>{
            this.boom()
        }
        this.state=0
    }
    boom(){
        this.world.delete(this)
        this.state=1
    }
    update(){
        if(this.state>0){
            this.state+=(11-this.state)/10
            if(this.state>10){
                for(let i in this.car.bullets){
                    if(this.car.bullets[i]===this){
                        this.car.bullets.splice(i,1)
                    }
                }
            }
        }
        
    }
    draw(ctx_=ctx){
        ctx_.save()
        ctx_.translate(this.position[0],this.position[1])
            if(this.state===0){
                ctx_.beginPath()
                ctx_.arc(0,0,5,0,Math.PI*2)
                ctx_.closePath()
                ctx_.fillStyle='white'
                ctx_.fill()
            }else{
                ctx_.globalAlpha=(10-this.state)/10
                ctx_.fillStyle='orange'

                ctx_.beginPath()
                ctx_.arc(0,0,this.state*10,0,Math.PI*2)
                ctx_.closePath()
                ctx_.fill()
                ctx_.beginPath()
                ctx_.arc(0,0,this.state*6,0,Math.PI*2)
                ctx_.closePath()
                ctx_.fill()

                ctx_.globalAlpha=1
            }
            


        ctx_.restore()
    }
}
class Information{
    constructor(x,y){
        this.position=[x,y]
        this.state=0
        this.text='Player1 \nEngine control:E,D,Y,G  Fire:V \nPlayer2 \nEngine control:7,4,9,6  Fire:0 \n \nGameover if someone was hit five times \nSpace to check characters HP'
        this.textArray=this.text.split('\n')
    }
    onclick(click_point){
        if(this.state===0){
            if(click_point[0]>1500&&click_point[1]<100){
                this.state=1
            }
        }else if(this.state===1){
            this.state=0
        }
    }
    draw(ctx_=ctx){
        ctx_.globalAlpha=0.8
        if(this.state===0){
            ctx_.beginPath()
            ctx_.arc(this.position[0],this.position[1],25,0,Math.PI*2)
            ctx_.closePath()
            ctx_.strokeStyle='white'
            ctx_.lineWidth=5
            ctx_.stroke()

            ctx_.font='45px serif'
            ctx_.fillStyle='white'
            ctx_.fillText('i',1543,63)
        }else if(this.state===1){
            ctx_.fillStyle='black'
            ctx_.fillRect(0,0,1600,800)
            ctx_.globalAlpha=1
            ctx_.font='45px serif'
            ctx_.fillStyle='yellow'
            for(let i in this.textArray){
                ctx_.fillText(this.textArray[i],100,100+50*i)
            }
            
        }

        

        ctx_.globalAlpha=1


    }
}