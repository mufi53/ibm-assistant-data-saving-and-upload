// Endpoint to be call from the client side
app.post('/api/message', function (req, res) {
  var assistantId = process.env.ASSISTANT_ID || '<assistant-id>';
  if (!assistantId || assistantId === '<assistant-id>>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>ASSISTANT_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var contextWithAcc = (req.body.context) ? req.body.context : newContext;

  if (req.body.context) {
    contextWithAcc.global.system.turn_count += 1;
  }

  //console.log(JSON.stringify(contextWithAcc, null, 2));

  var textIn = '';

  if(req.body.input) {
    textIn = req.body.input.text;
  }

  var payload = {
    assistant_id: assistantId,
    session_id: req.body.session_id,
    context: contextWithAcc,
    input: {
      message_type : 'text',
      text : textIn,
      options : {
        return_context : true
      }
    }
  };
  
  // Send the input to the assistant service
  assistant.message(payload, function (err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
   
    var variables ;
    
    req.session.conversation_id = req.body.session_id;
    // get data
    if(data.context.skills){
     variables = data.context['skills']['main skill']['user_defined'];

    //creating a context variable from the app 
    //data.context['skills']['main skill']['user_defined']['custom']='custom data set by app';
   // console.log(data.context.skills);
    }
    if (variables){
      capture_survey(variables , variables.survey , Survey , req.session.conversation_id , req);
      
    }

    if(variables && variables.insight_api ){
      Survey.findOne({ _id: req.session.conversation_id }).lean().exec(function (err, doc){
        
        if(doc && doc.insights){
        // upload data
        data.context['skills']['main skill']['user_defined']['insights']= doc.insights.toString();
        data.context['skills']['main skill']['user_defined']['insights_url']= "http://analyticame.com/?description="+doc.personal_description.toString().replace(/ /g,"%20")+"&id="+req.session.conversation_id;
       // console.log('description fetched from db',doc.personal_description , doc.personal_description.toString().replace(/ /g,"%20")+"&id="+req.session.conversation_id);
        
        return res.json(data);
        }
        else{
          console.log('doc not found',data.context.skills);
          return res.json(data);
        }


      });
}


    else{
    console.log('doc not found',data.context.skills);
    return res.json(data);
    
   }
});

});
