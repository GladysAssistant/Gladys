---
inject: true
to: ../front/src/routes/dashboard/Box.jsx
after: "return <SceneBox {...props} />;"
skip_if: "return <<%= className %>Box {...props} />;"
---
    case '<%= module %>':
      return <<%= className %>Box {...props} />;

