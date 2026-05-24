-- Devotee daily to-do items
CREATE TABLE public.todo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Todos select own"
ON public.todo_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Todos insert own"
ON public.todo_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Todos update own"
ON public.todo_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Todos delete own"
ON public.todo_items FOR DELETE
USING (auth.uid() = user_id);

-- Admin read all
CREATE POLICY "Admins can view all todos"
ON public.todo_items FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER update_todo_items_updated_at
BEFORE UPDATE ON public.todo_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_todo_items_user_date ON public.todo_items(user_id, due_date DESC);