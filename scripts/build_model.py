"""Run through Blender MCP. Builds only the dedicated Paternoster scene.

Coordinates: Blender Z up, X across the atrium, Y along its length.
GLB export converts to Three.js Y up. Dimensions inferred from references.
"""
import bpy, math, random, json
from mathutils import Vector, Matrix, Quaternion
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = 731
random.seed(SEED)
SCENE_NAME = 'Paternoster Square | Spatial Study'
old = bpy.data.scenes.get(SCENE_NAME)
if old:
    for obj in list(old.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(old)
scene = bpy.data.scenes.new(SCENE_NAME)
bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene['reference_note'] = 'Photo-based reconstruction; dimensions estimated. Market graphics illustrative.'
scene['seed'] = SEED
scene['plan_shape'] = 'trapezium: 14.5 m launch end, 8.5 m entrance end, 28 m long (estimated)'

MATS={}
def material(name, color, metal=0, rough=.45, alpha=1, emission=0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*color,alpha)
    m.use_nodes=True
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bs.inputs['Base Color'].default_value=(*color,alpha)
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Alpha'].default_value=alpha
    if emission:
        bs.inputs['Emission Color'].default_value=(*color,1)
        bs.inputs['Emission Strength'].default_value=emission
    m.use_backface_culling=False
    MATS[name]=m
    return m

material('Limestone',(.60,.60,.56),rough=.64)
material('StoneLight',(.73,.73,.69),rough=.53)
material('StoneWarm',(.66,.65,.60),rough=.57)
material('StoneCool',(.64,.66,.64),rough=.52)
material('Grout',(.36,.39,.38),rough=.9)
material('Steel',(.48,.53,.53),metal=.72,rough=.29)
material('SteelDark',(.15,.20,.21),metal=.6,rough=.3)
material('Frame',(.10,.14,.15),metal=.6,rough=.33)
material('Fascia',(.58,.65,.65),metal=.62,rough=.35)
material('Spandrel',(.27,.38,.40),metal=.2,rough=.33)
material('Glass',(.51,.74,.77),metal=.12,rough=.12,alpha=.15)
material('RoofGlass',(.67,.81,.85),metal=.08,rough=.1,alpha=.17)
material('OfficeWall',(.76,.75,.68),rough=.85)
material('Carpet',(.18,.23,.24),rough=.97)
material('Oak',(.49,.29,.12),rough=.54)
material('Chair',(.047,.068,.077),rough=.8)
material('Desk',(.70,.72,.68),rough=.65)
material('Monitor',(.015,.025,.033),rough=.45)
material('Reception',(.035,.055,.12),rough=.35)
material('Leaf',(.16,.26,.16),rough=.92)
material('Light',(.95,.89,.68),rough=.3,emission=2.2)
material('CoolLight',(.71,.80,1),rough=.3,emission=2)
material('LaunchButton',(.64,.71,.69),metal=.65,rough=.26)

BATCH={}
def geometry(group, mat, verts, faces, uvs=None):
    key=(group,mat)
    batch=BATCH.setdefault(key, {'v':[], 'f':[], 'uv':[]})
    start=len(batch['v']); batch['v'].extend(verts)
    batch['f'].extend([tuple(start+i for i in face) for face in faces])
    for f in faces:
        batch['uv'].append(uvs if uvs else [(0,0)]*len(f))

def box(group,mat,loc,size,rotation=None):
    x,y,z=size
    verts=[Vector((a*x/2,b*y/2,c*z/2)) for a,b,c in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]]
    if rotation:
        verts=[rotation@v for v in verts]
    verts=[v+Vector(loc) for v in verts]
    geometry(group,mat,verts,[(2,6,4,0),(5,7,3,1),(4,5,1,0),(3,7,6,2),(1,3,2,0),(6,7,5,4)])

def cylinder(group,mat,loc,radius,height,n=16):
    verts=[(loc[0]+radius*math.cos(i*math.tau/n),loc[1]+radius*math.sin(i*math.tau/n),loc[2]+h*height/2) for h in [-1,1] for i in range(n)]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    geometry(group,mat,verts,faces)

def beam(group,mat,a,b,width,depth=None):
    a,b=Vector(a),Vector(b)
    box(group,mat,(a+b)/2,(width,depth or width,(b-a).length),Vector((0,0,1)).rotation_difference(b-a).to_matrix())

def display_material(name,filename):
    m=material(name,(1,1,1),rough=.55)
    bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    tex=m.node_tree.nodes.new('ShaderNodeTexImage')
    tex.image=bpy.data.images.load(str(ROOT/'assets/textures'/filename),check_existing=False)
    m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color'])
    bs.inputs['Emission Strength'].default_value=.55

display_material('MarketDisplay','market.png')
display_material('TickerDisplay','ticker.png')
display_material('CubeDisplay','cube.png')

def screen(group,mat,center,width,height,right=(1,0,0),up=(0,0,1)):
    c=Vector(center);r=Vector(right)*width/2;u=Vector(up)*height/2
    geometry(group,mat,[c-r-u,c+r-u,c+r+u,c-r+u],[(0,1,2,3)],[(0,0),(1,0),(1,1),(0,1)])

# Pale stone lobby and a fine, staggered paving grid.
box('Ground','Grout',(0,0,-.19),(22,38,.35))
for x in range(-11,11):
    for y in range(-19,19,2):
        stone=random.choices(['StoneLight','StoneWarm','StoneCool'],[6,1,2])[0]
        box('FloorTiles',stone,(x+.5,y+1,-.012),(.99,1.99,.035))

# Seven repeated glazed storeys. Geometry is tapered at mesh assembly below.
FLOORS=7; STEP=4.1
for f in range(1,FLOORS+1):
    z=f*STEP
    for side in [-1,1]:
        box('FloorSlabs','Limestone',(side*8.3,0,z-.20),(4.6,32,.38))
        box('FloorFascia','Fascia',(side*6.03,0,z-.12),(.13,28.1,.50))
        box('OfficeCarpet','Carpet',(side*8.5,0,z+.008),(4.7,28,.035))
        box('OfficeBack','OfficeWall',(side*10.55,0,z+1.74),(.22,32,3.55))
        box('Spandrels','Spandrel',(side*6.09,0,z+.38),(.09,28,.65))
        box('GlassWalls','Glass',(side*6.07,0,z+2.12),(.035,28,2.8))
        for yy in range(-14,15,2):
            box('Mullions','Frame',(side*6.03,yy,z+1.84),(.09,.075,3.68))
        # Ceiling illumination, workstations and repeated columns visible behind glass.
        for yy in range(-12,13,4):
            box('OfficeLights','Light',(side*8.1,yy,z+3.67),(1.10,1.15,.045))
            box('OfficeColumns','Limestone',(side*9.9,yy,z+1.8),(.27,.29,3.6))
            if f<5:
                box('Desks','Desk',(side*8.1,yy,z+.77),(1.6,.8,.07))
                for dx in [-.65,.65]:
                    box('DeskLegs','SteelDark',(side*8.1+dx,yy,z+.39),(.04,.62,.75))
                box('Monitors','Monitor',(side*8.1,yy+.16,z+1.10),(.64,.06,.38))
                box('Monitors','SteelDark',(side*8.1,yy+.16,z+.9),(.035,.05,.24))
                box('Chairs','Chair',(side*8.1,yy-.85,z+.46),(.53,.50,.11))
                box('Chairs','Chair',(side*8.1,yy-1.08,z+.78),(.55,.075,.62))
                cylinder('DeskLegs','SteelDark',(side*8.1,yy-.85,z+.22),.065,.40,8)
    # End galleries close the rectangular atrium, with glazed balcony rails.
    for end in [-1,1]:
        box('FloorSlabs','Limestone',(0,end*15.5,z-.20),(12,3,.38))
        box('FloorFascia','Fascia',(0,end*14,z-.12),(12.2,.15,.50))
        if not (f==1 and end==-1):
            box('BalconyGlass','Glass',(0,end*14.02,z+.57),(12,.035,1.12))
            box('BalconyRail','Steel',(0,end*13.99,z+1.14),(12,.055,.065))
            for xx in range(-6,7,2):
                box('BalconyRail','Steel',(xx,end*14,z+.56),(.045,.06,1.1))
        if f==1 and end==-1:
            for side in [-1,1]:
                box('LiftLobbyWall','Limestone',(side*6.1,-17,z+1.7),(7,.3,3.6))
            box('LiftLobbyWall','Limestone',(0,-17,z+3.25),(5.2,.3,.65))
        else:
            box('EndWalls','OfficeWall',(0,end*17,z+1.7),(21,.3,3.6))
        for xx in ([-4,4] if f==1 and end==-1 else [-4,0,4]):
            box('EndOfficeGlass','Glass',(xx,end*16.80,z+1.8),(2.7,.05,2.7))
            box('EndOfficeFrames','Frame',(xx-1.35,end*16.76,z+1.8),(.07,.06,2.7))
            box('OfficeLights','Light',(xx,end*15.4,z+3.69),(1.4,.48,.04))
        box('GalleryLighting','Light',(0,end*14.06,z-.37),(11.6,.06,.045))

# Ground-level entry architecture and reception under the surrounding mezzanine.
for end in [-1,1]:
    for side in [-1,1]:
        box('EntranceStone','Limestone',(side*4.4,end*16.8,2),(4,.38,4))
    box('EntranceStone','Limestone',(0,end*16.8,3.6),(6,.4,.85))
    for xx in [-2.0,-.66,.66,2.0]:
        box('EntryGlass','Glass',(xx,end*16.79,1.6),(1.28,.03,3.1))
        box('EntryFrames','Steel',(xx-.66,end*16.76,1.6),(.055,.08,3.2))
        box('EntryHandles','Steel',(xx+.3,end*16.68,1.3),(.035,.1,.65))
    for xx in [-1.5,0,1.5]:
        box('SecurityGates','Steel',(xx,end*14.8,.52),(.30,1.3,1.04))
        box('SecurityGateGlass','Glass',(xx+.65,end*14.8,.72),(1.0,.05,.85))
    if end==1:
        box('DisplayFrame','Frame',(0,end*14.03,6.45),(7.2,.14,3.55))
        screen('MarketBoards','MarketDisplay',(0,end*13.93,6.45),7,3.35,right=(end,0,0))

for side in [-1,1]:
    for yy in [-12,-6,0,6,12]:
        cylinder('LobbyColumns','Steel',(side*6.55,yy,2.0),.31,4,24)
    box('ReceptionWall','Oak',(side*10,1,1.9),(.2,24,3.8))
    box('ReceptionLights','Light',(side*9.86,1,3.2),(.05,24,.07))
    box('ReceptionDesk','Reception',(side*8.9,-3,.52),(1.05,8,1.04))
    box('ReceptionDesk','StoneLight',(side*8.9,-3,1.065),(1.15,8.1,.065))
    for yy in [4,7,10]:
        cylinder('LobbySeats','StoneWarm',(side*8.4,yy,.3),.7,.45,24)
        cylinder('LobbySeats','Chair',(side*8.4,yy,.55),.64,.12,24)
        box('LobbySeats','Chair',(side*8.9,yy,.82),(.12,1.05,.55))
        cylinder('CafeTables','Oak',(side*7.15,yy+.8,.65),.36,.05,24)
        cylinder('CafeTables','SteelDark',(side*7.15,yy+.8,.31),.055,.62,12)

# Viewed FROM the launch balcony toward the far screen, stair is on the LEFT.
# It DESCENDS away from the balcony, then lands near the entrance at the far end.
STAIRS=34; run=20.0; start=-13.8
for i in range(STAIRS):
    yy=start+i*run/STAIRS
    zz=(STAIRS-i)*STEP/STAIRS
    box('StairTreads','StoneLight',(-4.6,yy,zz-.085),(2.6,run/STAIRS+.015,.17))
    box('StairRisers','Limestone',(-4.6,yy-run/STAIRS/2,zz-.17),(2.6,.04,.17))
    box('StairNosing','Steel',(-4.6,yy-run/STAIRS/2+.01,zz+.002),(2.61,.035,.02))
for xx in [-5.92,-3.28]:
    a=(xx,start-.20,STEP+.78); b=(xx,start+run,.78)
    beam('StairRails','Steel',a,b,.055)
    geometry('StairGlass','Glass',[(xx,start-.2,STEP-.16),(xx,start+run,.05),(xx,start+run,.8),(xx,start-.2,STEP+.85)],[(0,1,2,3)])
    for i in range(8):
        t=i/7;z=(1-t)*STEP
        beam('StairRails','Steel',(xx,start+t*run,z),(xx,start+t*run,z+.78),.045)
box('StairLanding','StoneLight',(-4.6,-14.5,STEP-.1),(2.6,1.4,.2))

# Dark ribbon displays around the mezzanine, above and below office glass.
for z in [3.90,7.96]:
    for side in [-1,1]:
        box('TickerFrames','Frame',(side*5.94,0,z),(.12,28,.52))
        screen('TickerBands','TickerDisplay',(side*5.865,0,z),28,.43,right=(0,-side,0))
    for end in [-1,1]:
        box('TickerFrames','Frame',(0,end*13.91,z),(12,.12,.52))
        if not (end==-1 and z<5):
            screen('TickerBands','TickerDisplay',(0,end*13.835,z),12,.43,right=(end,0,0))

# 1F launch balcony: broad concave brushed steel parapet, central square control.
box('LaunchParapet','Reception',(0,-13.87,STEP+.45),(7.6,.5,.9))
for i in range(16):
    t=i/16;u=(i+1)/16
    y1=-14.23+.60*t;y2=-14.23+.60*u
    z1=STEP+.76+.42*t*t;z2=STEP+.76+.42*u*u
    geometry('LaunchParapetSteel','Steel',[(-3.8,y1,z1),(3.8,y1,z1),(3.8,y2,z2),(-3.8,y2,z2)],[(0,1,2,3)])
box('LaunchParapetRail','Steel',(0,-13.61,STEP+1.20),(7.7,.07,.065))
# The solid trapezoidal console projects back toward the lift lobby.
geometry('LaunchConsole','Steel',[(-.52,-14.75,STEP),(.52,-14.75,STEP),(.46,-13.97,STEP),(-.46,-13.97,STEP),(-.60,-14.85,STEP+1.0),(.60,-14.85,STEP+1.0),(.5,-13.96,STEP+1.17),(-.5,-13.96,STEP+1.17)],[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)])
buttonrot=Matrix.Rotation(math.atan(.17/.89),3,'X')
box('LaunchButtonBezel','Frame',(0,-14.41,STEP+1.106),(.49,.49,.035),buttonrot)
box('LaunchButton','LaunchButton',(0,-14.41,STEP+1.132),(.40,.40,.028),buttonrot)
# A small abstract radial engraving, matching the engraved metal control in video.
for i in range(12):
    a=i*math.tau/12
    beam('LaunchButtonEngraving','SteelDark',(.06*math.cos(a),-14.41+.06*math.sin(a),STEP+1.155),(.145*math.cos(a),-14.41+.145*math.sin(a),STEP+1.155),.011)
# Lift lobby: a deep axial corridor, silver lift doors and repeated luminous portals.
box('LiftLobbyFloor','StoneLight',(0,-21.5,STEP-.12),(5.2,9,.24))
box('LiftLobbyCeiling','OfficeWall',(0,-21.5,STEP+3.35),(5.2,9,.2))
for side in [-1,1]:
    box('LiftLobbyWalls','Limestone',(side*2.65,-21.5,STEP+1.6),(.25,9,3.2))
    for yy in [-18.8,-22,-25]:
        box('LiftDoorFrame','Frame',(side*2.49,yy,STEP+1.25),(.12,1.95,2.6))
        for sign in [-1,1]:
            box('LiftDoors','Steel',(side*2.405,yy+sign*.46,STEP+1.25),(.03,.895,2.48))
        box('LiftCallPanel','Monitor',(side*2.39,yy+1.10,STEP+1.3),(.03,.13,.28))
for yy in [-17.4,-20.1,-22.8,-25.5]:
    box('LiftPortalLights','Light',(0,yy,STEP+3.19),(5.0,.08,.06))
    for side in [-1,1]:
        box('LiftPortalLights','Light',(side*2.46,yy,STEP+1.75),(.06,.08,2.9))
box('LobbyScreenFrame','Frame',(-3.95,-16.77,STEP+1.9),(2.3,.15,1.6))
screen('LobbyMarketScreen','MarketDisplay',(-3.95,-16.675,STEP+1.9),2.2,1.5,right=(-1,0,0))

# Iconic tilted four-sided market cube, supported by a perforated steel plinth.
cylinder('MarketPedestal','Steel',(0,2.5,.97),.45,1.94,32)
for i in range(7):
    for j in range(6):
        angle=j*math.tau/6
        loc=(.454*math.cos(angle),2.5+.454*math.sin(angle),.23+i*.23)
        box('PedestalPerforations','Monitor',loc,(.055,.055,.075))
rot=(Matrix.Rotation(math.radians(45),3,'Y') @ Matrix.Rotation(math.radians(15),3,'Z'))
center=Vector((0,2.5,3.10))
box('MarketCube','Frame',center,(2.13,2.13,2.13),rot)
for normal,right,up in [((0,-1,0),(1,0,0),(0,0,1)),((0,1,0),(-1,0,0),(0,0,1)),((1,0,0),(0,1,0),(0,0,1)),((-1,0,0),(0,-1,0),(0,0,1))]:
    screen('MarketCubeScreens','CubeDisplay',center+rot@Vector(normal)*1.072,2.03,2.03,rot@Vector(right),rot@Vector(up))

# Fine roof grid and cross ties are prominent in the upward reference views.
roofz=FLOORS*STEP+3.85
box('RoofGlazing','RoofGlass',(0,0,roofz+.08),(12.3,28.2,.06))
for yy in range(-14,15,2):
    beam('RoofStructure','SteelDark',(-6.25,yy,roofz),(6.25,yy,roofz),.1,.16)
for xx in range(-6,7,2):
    beam('RoofStructure','SteelDark',(xx,-14.2,roofz),(xx,14.2,roofz),.08,.12)
for yy in [-14,-7,0,7,14]:
    beam('RoofTrusses','Steel',(-6.2,yy,roofz-.95),(6.2,yy,roofz-.95),.12)
    for xx in [-6,-3,0,3,6]:
        beam('RoofTrusses','Steel',(xx,yy,roofz-.95),(xx+(-1.5 if xx>0 else 1.5),yy,roofz),.045)

# Suspension rods, theatrical fixtures, timber tables and restrained planting.
for xx in [-5.45,5.45]:
    for yy in [-10,10]:
        beam('Suspension','Steel',(xx,yy,8.5),(xx,yy,roofz),.038)
        for zz in [9.2,11.1,13]:
            box('AtriumFixtures','Monitor',(xx,yy,zz),(.32,.40,.33))
            box('AtriumFixtures','CoolLight',(xx,yy-.21,zz),(.20,.015,.20))
for f in [2,3]:
    for yy in [-10,-4,4,10]:
        z=f*STEP
        cylinder('BalconyTables','Oak',(7.10,yy,z+.75),.52,.055,28)
        cylinder('BalconyTables','SteelDark',(7.10,yy,z+.36),.055,.72,12)
        cylinder('BalconyTables','SteelDark',(7.10,yy,z+.055),.29,.04,16)
for xx,yy in [(7.8,12),(-8.2,-12),(8.5,-11)]:
    cylinder('Planters','StoneWarm',(xx,yy,.36),.49,.72,20)
    for i in range(14):
        ang=random.random()*math.tau
        length=random.uniform(.3,.65)
        beam('Plants','Leaf',(xx,yy,.65),(xx+math.cos(ang)*length,yy+math.sin(ang)*length,random.uniform(1.15,1.9)),.10,.045)

# Commit one mesh per semantic group/material to keep GPU draw calls low.
for (group,mat),data in BATCH.items():
    mesh=bpy.data.meshes.new(group+'Mesh')
    # The void widens toward the launch/lift-lobby end. This deforms the
    # entire structural frame consistently rather than hiding rectangular corners.
    def taper(v):
        x,y,z=v
        halfwidth=7.25-(max(-14,min(14,y))+14)*3/28
        return (x*halfwidth/6,y,z)
    untapered={'MarketCube','MarketCubeScreens','MarketPedestal','PedestalPerforations','LaunchConsole','LaunchButton','LaunchButtonBezel','LaunchButtonEngraving','LiftLobbyFloor','LiftLobbyCeiling','LiftLobbyWalls','LiftDoorFrame','LiftDoors','LiftCallPanel','LiftPortalLights'}
    verts=data['v'] if group in untapered else [taper(v) for v in data['v']]
    mesh.from_pydata(verts,[],data['f']);mesh.update()
    mesh.materials.append(MATS[mat])
    if mat.endswith('Display'):
        uv=mesh.uv_layers.new(name='UVMap')
        for poly,coords in zip(mesh.polygons,data['uv']):
            for li,coord in zip(poly.loop_indices,coords): uv.data[li].uv=coord
    obj=bpy.data.objects.new(group+'_'+mat,mesh)
    scene.collection.objects.link(obj)
    obj['component']=group
    obj['material_class']=mat

# Preview camera, daylight and soft lobby illumination (viewer uses its own lighting).
def area(name,loc,power,size,target):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
area('Skylight',(0,0,30),6500,12,(0,0,0))
area('EntryFill',(0,-10,9),1700,8,(0,2,4))
world=bpy.data.worlds.new('Paternoster Daylight');scene.world=world;world.use_nodes=True
next(n for n in world.node_tree.nodes if n.type=='BACKGROUND').inputs[0].default_value=(.66,.75,.84,1)
next(n for n in world.node_tree.nodes if n.type=='BACKGROUND').inputs[1].default_value=.5
camdata=bpy.data.cameras.new('Balcony View');cam=bpy.data.objects.new('Balcony View',camdata)
scene.collection.objects.link(cam);cam.location=(4.6,-11,10.5)
cam.rotation_euler=(Vector((-1,4,5))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.lens=20;scene.camera=cam
scene.render.resolution_x=1440;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
for area_ in bpy.context.screen.areas:
    if area_.type=='VIEW_3D':
        area_.spaces.active.region_3d.view_perspective='CAMERA'
        area_.spaces.active.shading.type='MATERIAL'

out=ROOT/'public/models';out.mkdir(parents=True,exist_ok=True)
for image_ in bpy.data.images:
    if image_.source=='FILE' and image_.has_data and image_.filepath.endswith(('market.png','ticker.png','cube.png')):
        image_.pack()
for obj in scene.objects: obj.select_set(False)
for area_ in bpy.context.screen.areas:
    if area_.type=='VIEW_3D': area_.spaces.active.overlay.show_overlays=False
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/paternoster.blend'))
for obj in scene.objects: obj.select_set(obj.type=='MESH')
bpy.ops.export_scene.gltf(filepath=str(out/'paternoster.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
stats={'seed':SEED,'scene':scene.name,'objects':len([o for o in scene.objects if o.type=='MESH']),'vertices':sum(len(o.data.vertices) for o in scene.objects if o.type=='MESH'),'floors':FLOORS,'height':roofz,'plan_shape':'trapezium','wide_end':14.5,'narrow_end':8.5,'stair_rises_toward':'launch balcony','launch_button':True,'estimated_dimensions':True}
(out/'metadata.json').write_text(json.dumps(stats,indent=2))
print(json.dumps(stats))
