#!/usr/bin/env python3
"""Original Hushwood social animation. Requires Python 3/Pillow and ffmpeg."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, argparse
ROOT=Path(__file__).resolve().parents[1]
W,H,FPS,DURATION=540,960,24,20
CREAM='#F5F1E5'; INK='#183E32'; LIME='#C9E766'; ORANGE='#E88348'; MUTED='#667465'
fonts={}
def font(size,serif=False):
    key=(size,serif)
    if key not in fonts: fonts[key]=ImageFont.truetype(str(ROOT/'public/fonts'/('fraunces.ttf' if serif else 'dm-sans.ttf')),size)
    return fonts[key]
def ease(x):
    x=max(0,min(1,x));return x*x*(3-2*x)
def text(d,xy,s,size=20,fill=INK,serif=False,anchor='la'):
    d.text(xy,s,font=font(size,serif),fill=fill,anchor=anchor)
def leaf(d,x,y,r,fill,flip=False):
    d.ellipse((x-r,y-r*.38,x+r,y+r*.38),fill=fill)
    d.line((x-r*.8,y,x+r*.8,y),fill=INK,width=1)
mascots={}
def mascot(blink,happy,stage):
    key=(blink,happy,stage)
    if key in mascots:return mascots[key]
    # Same original Fern geometry as src/Creature.tsx, supersampled for video.
    scale=3
    im=Image.new('RGBA',(960,960));d=ImageDraw.Draw(im)
    fill='#bdd964';shade='#688c3d';dark='#193b2c'
    def ellipse(box,color):d.ellipse(tuple(v*scale for v in box),fill=color)
    def path(points,color,stroke=False,width=1):
        coords=[];current=None
        for op,args in points:
            if op=='M' or op=='L':
                current=args;coords.append(tuple(v*scale for v in current))
            elif op=='Q':
                ox,oy=current;cx,cy,x,y=args
                for n in range(1,25):
                    q=n/24;coords.append(((1-q)**2*ox*scale+2*(1-q)*q*cx*scale+q*q*x*scale,(1-q)**2*oy*scale+2*(1-q)*q*cy*scale+q*q*y*scale))
                current=(x,y)
        if stroke:d.line(coords,fill=color,width=width*scale,joint='curve')
        else:d.polygon(coords,fill=color)
    ellipse((72,274,248,298),'#CCD6BB')
    path([('M',(158,105)),('Q',(104,84,119,39)),('Q',(163,42,169,97))],shade)
    path([('M',(166,103)),('Q',(170,61,212,61)),('Q',(216,101,166,111))],fill)
    path([('M',(85,203)),('Q',(47,178,55,209)),('Q',(58,237,91,236))],shade)
    path([('M',(231,203)),('Q',(273,176,267,209)),('Q',(264,239,231,236))],shade)
    d.rounded_rectangle((82*scale,93*scale,239*scale,276*scale),75*scale,fill=fill)
    ellipse((108,171,212,259),'#E5EBAD')
    ellipse((86,258,136,284),shade);ellipse((185,258,235,284),shade)
    for x in [124,196]:
        if blink:path([('M',(x-10,166)),('Q',(x,174,x+10,166))],dark,True,6)
        else:
            ellipse((x-7,152,x+7,172),dark);ellipse((x,157,x+4,161),'white')
    ellipse((95,175,119,189),'#DDA278');ellipse((201,175,225,189),'#DDA278')
    if happy:path([('M',(148,184)),('Q',(160,198,172,184))],dark,True,5)
    else:ellipse((153,179,167,199),dark)
    if stage:path([('M',(138,223)),('L',(160,210)),('L',(182,223)),('L',(160,240))],shade)
    im=im.resize((360,360),Image.Resampling.LANCZOS);mascots[key]=im;return im

def creature(im,d,t,growth=0,happy=True):
    y=334+int(math.sin(t*2)*5)
    sprite=mascot(t%3.7>3.5,happy,growth>.3)
    im.paste(sprite,(90,y),sprite)
    if growth>.3:
        for i in range(6):
            a=i*math.pi/3+t*.2;px=270+145*math.cos(a);py=535+135*math.sin(a)
            rr=4+3*math.sin(t*4+i)**2
            d.ellipse((px-rr,py-rr,px+rr,py+rr),fill=ORANGE)
def pill(d,box,label,bg=LIME,fg=INK,size=15):
    d.rounded_rectangle(box,18,fill=bg)
    text(d,((box[0]+box[2])/2,(box[1]+box[3])/2),label,size,fg,anchor='mm')
def base(t,scene):
    im=Image.new('RGB',(W,H),CREAM);d=ImageDraw.Draw(im)
    d.rectangle((22,22,W-23,H-23),outline='#DADCCE',width=1)
    text(d,(42,56),'hushwood',28,serif=True)
    text(d,(498,57),'FIELD NOTES / 01',11,MUTED,anchor='ra')
    d.line((42,90,498,90),fill='#CDD4C2',width=1)
    for i in range(5):d.rounded_rectangle((42+i*94,905,42+i*94+80,908),2,fill=INK if i<=scene else '#D2D7C8')
    text(d,(42,932),'A LITTLE QUIET. A LOT OF GROWTH.',10,MUTED)
    text(d,(498,932),f'{scene+1:02d} / 05',10,MUTED,anchor='ra')
    return im,d
SCENES=[('Make room','for focus.','A classroom game that listens.'),('Quiet moments.','Growing streaks.','Stay below your chosen sound threshold.'),('Small habits.','New possibilities.','Earn XP. Help your companion evolve.'),('One school.','A shared quest.','Bring your classes together in a school cup.'),('Let your class','grow together.','Try the public game. Build a quieter routine.')]
def frame(t):
    scene=min(4,int(t/4));u=t-scene*4
    im,d=base(t,scene);a,b,subtitle=SCENES[scene]
    rise=int((1-ease(u/.6))*20)
    text(d,(42,141+rise),a,44,serif=True);text(d,(42,195+rise),b,44,serif=True)
    text(d,(42,272),subtitle,16)
    if scene<3:
        d.ellipse((48,356,492,766),fill='#E5EAD5')
        d.arc((69,378,471,742),185,355,fill='#C1CDAA',width=2)
        for i in range(7):
            x=75+i*66;y=693+(i%2)*17
            d.line((x,y+30,x,y),fill='#8DAB67',width=3)
            leaf(d,x-8,y+4,11,'#B3C984');leaf(d,x+8,y-3,11,'#94B267')
        creature(im,d,t,ease((u-.5)/2) if scene==2 else 0,happy=scene!=0 or u>1)
        if scene==0:
            pill(d,(150,333,390,371),'YOUR CLASSROOM COMPANION')
            d.rounded_rectangle((85,780,455,840),18,fill=INK)
            for i in range(37):
                level=(.2+.8*abs(math.sin(i*1.9+t*3)))*(1-.7*ease(u/2))
                bh=8+level*26
                d.rounded_rectangle((106+i*9,810-bh/2,110+i*9,810+bh/2),2,fill=LIME)
            text(d,(270,861),'Sound down. Curiosity up.',16,anchor='mm')
        elif scene==1:
            pill(d,(176,333,364,373),'KEEP THE STREAK',INK,CREAM)
            text(d,(270,774),f'{int(20+u*3):02d}s',52,serif=True,anchor='mm')
            text(d,(270,824),'quiet streak · illustrative demo',14,MUTED,anchor='mm')
            d.rounded_rectangle((109,854,431,862),4,fill='#D3DBC4')
            d.rounded_rectangle((109,854,109+int(322*min(1,.25+u/5)),862),4,fill=INK)
        else:
            pill(d,(177,333,363,373),'ROOM TO GROW',INK,CREAM)
            text(d,(270,775),'Every calm moment counts.',22,serif=True,anchor='mm')
            pill(d,(172,820,368,863),'QUIET TIME → XP',LIME,size=17)
    elif scene==3:
        d.ellipse((115,350,425,660),fill=LIME)
        # Original cup drawing; no fabricated leaderboard or class identities.
        d.arc((142,410,246,520),75,280,fill=INK,width=12)
        d.arc((294,410,398,520),-100,105,fill=INK,width=12)
        d.rounded_rectangle((196,397,344,530),28,fill=INK)
        d.rectangle((257,510,283,584),fill=INK)
        d.rounded_rectangle((213,579,327,597),8,fill=INK)
        leaf(d,270,458,35,LIME)
        for i in range(9):
            x=90+(i*61)%370;y=350+(i*77+int(u*28))%290
            d.ellipse((x-3,y-3,x+3,y+3),fill=ORANGE)
        for y,label in [(706,'Shared progress'),(760,'Teacher-set rewards'),(814,'A dashboard for your school')]:
            d.line((45,y+35,495,y+35),fill='#CDD4C2',width=1)
            d.ellipse((49,y+1,61,y+13),fill=ORANGE)
            text(d,(78,y-3),label,22)
    else:
        d.rounded_rectangle((42,335,498,720),32,fill=INK)
        # Render mascot on the shared cream paper cutout.
        d.ellipse((118,372,422,676),fill='#E5EAD5')
        creature(im,d,t,.5)
        pill(d,(157,691,383,731),'OPEN SOURCE · MADE FOR SCHOOLS',LIME,size=11)
        text(d,(270,781),'Start your quiet adventure',26,serif=True,anchor='mm')
        text(d,(270,823),'hushwood.akkaz.chatgpt.site',21,anchor='mm')
        text(d,(270,862),'No audio recordings. Just a little focus.',14,MUTED,anchor='mm')
    # Brief paper-colored dissolve between the journal pages.
    transition=(1-ease(u/.23)) if scene else 0
    if transition:im=Image.blend(im,Image.new('RGB',(W,H),CREAM),transition)
    return im

def main():
    p=argparse.ArgumentParser();p.add_argument('--contact-sheet',type=Path);args=p.parse_args()
    out=ROOT/'public/media/hushwood-teaser.mp4';out.parent.mkdir(parents=True,exist_ok=True)
    cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','slow','-crf','27','-maxrate','480k','-bufsize','960k','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    for n in range(FPS*DURATION):proc.stdin.write(frame(n/FPS).tobytes())
    proc.stdin.close()
    if proc.wait():raise SystemExit('ffmpeg failed')
    if args.contact_sheet:
        sheet=Image.new('RGB',(W*5,H),CREAM)
        for i in range(5):sheet.paste(frame(i*4+2.8),(i*W,0))
        sheet.save(args.contact_sheet)
    print(f'{out}: {out.stat().st_size:,} bytes')
if __name__=='__main__':main()
