import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
class Splash extends StatefulWidget {
  final Widget child;
  const Splash({super.key, required this.child});
  @override State<Splash> createState() => _SplashState();
}
class _SplashState extends State<Splash> with SingleTickerProviderStateMixin {
  late final controller=AnimationController(vsync:this,duration:const Duration(milliseconds:1250));
  Path? path; bool done=false;
  @override void initState(){super.initState();load();}
  Future<void> load() async {
    final svg=await rootBundle.loadString('assets/data/logo.svg');
    final d=RegExp(r'd="([^"]+)"').firstMatch(svg)!.group(1)!;
    final p=Path();
    for(final m in RegExp(r'([ML])\s+([\d.]+)\s+([\d.]+)').allMatches(d)){
      final x=double.parse(m.group(2)!),y=double.parse(m.group(3)!);
      if(m.group(1)=='M'){p.moveTo(x,y);}else{p.lineTo(x,y);}
    }
    if(!mounted)return;
    setState(()=>path=p);
    if(MediaQuery.disableAnimationsOf(context)){controller.value=1;}else{await controller.forward();}
    if(mounted)setState(()=>done=true);
  }
  @override void dispose(){controller.dispose();super.dispose();}
  @override Widget build(BuildContext context)=>AnimatedSwitcher(
    duration:const Duration(milliseconds:180),
    child:done?widget.child:Scaffold(key:const ValueKey('splash'),body:Center(child:Semantics(label:'CodeBridge',child:SizedBox(width:320,height:90,child:AnimatedBuilder(animation:controller,builder:(_,child)=>CustomPaint(painter:StrokePainter(path,Curves.easeInOutCubic.transform(controller.value)))))))),
  );
}
class StrokePainter extends CustomPainter {
  final Path? path;final double progress;
  StrokePainter(this.path,this.progress);
  @override void paint(Canvas c,Size s){
    if(path==null)return;
    c.scale(s.width/300,s.height/70);
    final metrics=path!.computeMetrics().toList();
    var remaining=metrics.fold<double>(0,(v,m)=>v+m.length)*progress;
    final paint=Paint()..color=const Color(0xFF9DFF52)..style=PaintingStyle.stroke..strokeWidth=3..strokeCap=StrokeCap.round..strokeJoin=StrokeJoin.round;
    for(final metric in metrics){if(remaining<=0)break;c.drawPath(metric.extractPath(0,math.min(metric.length,remaining)),paint);remaining-=metric.length;}
  }
  @override bool shouldRepaint(StrokePainter old)=>old.progress!=progress||old.path!=path;
}
