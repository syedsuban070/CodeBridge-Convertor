import 'package:flutter/material.dart';
import '../main.dart' show db,locale,green;
class Shop extends StatefulWidget {
 const Shop({super.key});
 @override State<Shop> createState()=>_ShopState();
}
class _ShopState extends State<Shop>{
 List<Map<String,dynamic>> items=[];int coins=0;bool busy=false;
 @override void initState(){super.initState();load();}
 Future<void> load()async{final data=await db.catalog(),wallet=await db.wallet();if(mounted){setState((){items=data;coins=wallet['coins'] as int;});}}
 Future<void> buy(Map item)async{if(busy)return;setState(()=>busy=true);try{await db.buy(item['id']);await load();}catch(e){if(mounted){ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content:Text('Purchase failed. Check your coin balance.')));}}finally{if(mounted)setState(()=>busy=false);}}
 @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Cosmetics'),actions:[Padding(padding:const EdgeInsets.all(18),child:Text('$coins ◈',style:const TextStyle(color:green)))]),body:ListView(padding:const EdgeInsets.all(20),children:[const Text('Earned through code. Stored on this device.',style:TextStyle(color:Colors.grey)),const SizedBox(height:20),for(final item in items)Card(child:Padding(padding:const EdgeInsets.all(20),child:Column(crossAxisAlignment:CrossAxisAlignment.stretch,children:[Icon(item['type']=='bit_skin'?Icons.smart_toy:item['type']=='terminal_theme'?Icons.terminal:Icons.palette,size:38,color:green),const SizedBox(height:12),Text(item['names'][locale],style:const TextStyle(fontSize:22)),Text(item['rarity']),const SizedBox(height:14),FilledButton.tonal(onPressed:busy||item['equipped']==true?null:()=>buy(item),child:Text(item['equipped']==true?'Equipped':item['owned']==true?'Equip':'${item['price']} ◈'))])))]));
}
